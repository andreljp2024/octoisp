const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { queryMetricsAsUser, withMetricsUser } = require('../metrics');
const { requirePermission } = require('../middleware/requirePermission');

const mapStatus = (status) => {
  if (!status) return 'online';
  if (status === 'active') return 'online';
  return status;
};

const parsePercent = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim();
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const withScopedUser = (req, handler) =>
  withUser(req.user.id, async (client) => {
    if (req.role === 'admin_global') {
      await client.query('SET LOCAL row_security = off');
    }
    return handler(client);
  });

const queryMetrics = (req, text, params = []) => {
  if (req.role === 'admin_global') {
    return withMetricsUser(req.user.id, async (client) => {
      await client.query('SET LOCAL row_security = off');
      return client.query(text, params);
    });
  }
  return queryMetricsAsUser(req.user.id, text, params);
};

const calcPopStatus = ({ total, online, degraded }) => {
  if (!total || total === 0) return 'offline';
  if (online === 0) return 'offline';
  const offline = total - online;
  if (degraded > 0 || offline / total >= 0.3) return 'degraded';
  return 'online';
};

const toMbps = (value) => {
  if (value === null || value === undefined) return null;
  return Number((Number(value) / 1_000_000).toFixed(2));
};

// GET /api/pops - List all POPs
router.get('/', requirePermission('pops.view'), async (req, res) => {
  try {
    const isGlobalAdmin = req.role === 'admin_global';
    const providerId = req.query.providerId;

    const { query, params } = (() => {
      if (isGlobalAdmin && providerId) {
        return {
          query: `
            SELECT p.*,
                   pr.name AS provider_name,
                   COUNT(DISTINCT d.id) AS devices_count,
                   COUNT(DISTINCT c.id) AS customers_count
            FROM pops p
            JOIN providers pr ON pr.id = p.provider_id
            LEFT JOIN devices d ON d.pop_id = p.id
            LEFT JOIN customers c ON c.pop_id = p.id
            WHERE p.provider_id = $1
            GROUP BY p.id, pr.name
            ORDER BY p.created_at DESC
          `,
          params: [providerId]
        };
      }
      if (isGlobalAdmin && !providerId) {
        return {
          query: `
            SELECT p.*,
                   pr.name AS provider_name,
                   COUNT(DISTINCT d.id) AS devices_count,
                   COUNT(DISTINCT c.id) AS customers_count
            FROM pops p
            JOIN providers pr ON pr.id = p.provider_id
            LEFT JOIN devices d ON d.pop_id = p.id
            LEFT JOIN customers c ON c.pop_id = p.id
            GROUP BY p.id, pr.name
            ORDER BY p.created_at DESC
          `,
          params: []
        };
      }
      return {
        query: `
          SELECT p.*,
                 pr.name AS provider_name,
                 COUNT(DISTINCT d.id) AS devices_count,
                 COUNT(DISTINCT c.id) AS customers_count
          FROM pops p
          JOIN providers pr ON pr.id = p.provider_id
          LEFT JOIN devices d ON d.pop_id = p.id
          LEFT JOIN customers c ON c.pop_id = p.id
          WHERE p.provider_id = $1
          GROUP BY p.id, pr.name
          ORDER BY p.created_at DESC
        `,
        params: [req.tenantId]
      };
    })();

    const result = await withScopedUser(req, (client) => client.query(query, params));

    return res.json({
      pops: result.rows.map((row) => ({
        id: row.id,
        providerId: row.provider_id,
        providerName: row.provider_name,
        name: row.name,
        location: row.city,
        address: row.address,
        status: mapStatus(row.status),
        devices: Number(row.devices_count || 0),
        customers: Number(row.customers_count || 0),
        utilization: row.utilization_percent,
        latency: row.latency_ms,
        uplink: row.uplink_capacity,
        coordinates: {
          lat: row.latitude,
          lng: row.longitude
        }
      })),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar POPs:', error);
    return res.status(500).json({ error: 'Failed to fetch POPs' });
  }
});

// GET /api/pops/:id/monitoring - POP realtime monitoring
router.get('/:id/monitoring', requirePermission('pops.view'), async (req, res) => {
  try {
    const { id } = req.params;

    const popResult = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT p.id,
                 p.provider_id,
                 pr.name AS provider_name,
                 p.name,
                 p.city,
                 p.status,
                 p.uplink_capacity,
                 p.utilization_percent,
                 p.latency_ms,
                 COUNT(d.id) AS devices_count,
                 COUNT(*) FILTER (WHERE d.status = 'online') AS devices_online,
                 COUNT(*) FILTER (WHERE d.status = 'offline') AS devices_offline,
                 COUNT(*) FILTER (WHERE d.status = 'degraded') AS devices_degraded
          FROM pops p
          JOIN providers pr ON pr.id = p.provider_id
          LEFT JOIN devices d ON d.pop_id = p.id
          WHERE p.id = $1
          GROUP BY p.id, pr.name
          LIMIT 1
        `,
        [id]
      )
    );

    if (!popResult.rowCount) {
      return res.status(404).json({ error: 'POP not found' });
    }

    const popRow = popResult.rows[0];
    const totalDevices = Number(popRow.devices_count || 0);
    const onlineDevices = Number(popRow.devices_online || 0);
    const degradedDevices = Number(popRow.devices_degraded || 0);
    const status = calcPopStatus({
      total: totalDevices,
      online: onlineDevices,
      degraded: degradedDevices
    });

    const providerId = popRow.provider_id;

    const devicesResult = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT id
          FROM devices
          WHERE pop_id = $1
        `,
        [id]
      )
    );
    const deviceIds = devicesResult.rows.map((row) => row.id);

    let series = [];
    let current = {
      downloadMbps: 0,
      uploadMbps: 0,
      latencyMs: popRow.latency_ms || null,
      packetLoss: 0
    };

    if (deviceIds.length) {
      const metricsSeries = await queryMetrics(
        req,
        `
          SELECT bucket AS time,
                 SUM(avg_in_bps) AS in_bps,
                 SUM(avg_out_bps) AS out_bps,
                 MAX(max_latency) AS latency_ms,
                 AVG(avg_packet_loss) AS packet_loss
          FROM device_metrics_5m
          WHERE provider_id = $1
            AND device_id = ANY($2::uuid[])
            AND bucket >= NOW() - INTERVAL '6 hours'
          GROUP BY bucket
          ORDER BY bucket ASC
        `,
        [providerId, deviceIds]
      );

      series = metricsSeries.rows.map((row) => ({
        time: row.time,
        downloadMbps: toMbps(row.in_bps),
        uploadMbps: toMbps(row.out_bps),
        latencyMs: row.latency_ms ? Number(Number(row.latency_ms).toFixed(2)) : null,
        packetLoss: row.packet_loss ? Number(Number(row.packet_loss).toFixed(2)) : 0
      }));

      const currentMetrics = await queryMetrics(
        req,
        `
          SELECT SUM(traffic_in_bps) AS in_bps,
                 SUM(traffic_out_bps) AS out_bps,
                 MAX(latency_ms) AS latency_ms,
                 AVG(packet_loss) AS packet_loss
          FROM device_metrics
          WHERE provider_id = $1
            AND device_id = ANY($2::uuid[])
            AND time >= NOW() - INTERVAL '5 minutes'
        `,
        [providerId, deviceIds]
      );

      if (currentMetrics.rowCount) {
        const row = currentMetrics.rows[0];
        current = {
          downloadMbps: toMbps(row.in_bps) || 0,
          uploadMbps: toMbps(row.out_bps) || 0,
          latencyMs: row.latency_ms ? Number(Number(row.latency_ms).toFixed(2)) : null,
          packetLoss: row.packet_loss ? Number(Number(row.packet_loss).toFixed(2)) : 0
        };
      }
    }

    let topDevices = [];
    if (deviceIds.length) {
      const topMetrics = await queryMetrics(
        req,
        `
          SELECT device_id,
                 SUM(avg_in_bps) AS in_bps,
                 SUM(avg_out_bps) AS out_bps
          FROM device_metrics_5m
          WHERE provider_id = $1
            AND device_id = ANY($2::uuid[])
            AND bucket >= NOW() - INTERVAL '1 hour'
          GROUP BY device_id
          ORDER BY (SUM(avg_in_bps) + SUM(avg_out_bps)) DESC
          LIMIT 10
        `,
        [providerId, deviceIds]
      );

      const topDeviceIds = topMetrics.rows.map((row) => row.device_id);
      if (topDeviceIds.length) {
        const deviceDetail = await withScopedUser(req, (client) =>
          client.query(
            `
              SELECT d.id,
                     d.serial_number,
                     d.notes,
                     d.status,
                     d.last_contact,
                     c.name AS customer_name
              FROM devices d
              LEFT JOIN customers c ON c.id = d.customer_id
              WHERE d.id = ANY($1::uuid[])
            `,
            [topDeviceIds]
          )
        );

        const detailMap = new Map(
          deviceDetail.rows.map((row) => [
            row.id,
            {
              id: row.id,
              name: row.notes || row.serial_number,
              status: row.status,
              lastSeen: row.last_contact,
              customerName: row.customer_name
            }
          ])
        );

        topDevices = topMetrics.rows.map((row) => {
          const detail = detailMap.get(row.device_id) || {};
          const downloadMbps = toMbps(row.in_bps) || 0;
          const uploadMbps = toMbps(row.out_bps) || 0;
          return {
            id: row.device_id,
            name: detail.name || row.device_id,
            status: detail.status || 'offline',
            customerName: detail.customerName || '—',
            lastSeen: detail.lastSeen,
            downloadMbps,
            uploadMbps,
            totalMbps: Number((downloadMbps + uploadMbps).toFixed(2))
          };
        });
      }
    }

    const alertsResult = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT a.id,
                 a.title,
                 a.severity,
                 a.status,
                 a.created_at,
                 a.alert_type,
                 d.serial_number,
                 d.notes AS device_name,
                 c.name AS customer_name
          FROM alerts a
          LEFT JOIN devices d ON d.id = a.device_id
          LEFT JOIN customers c ON c.id = a.customer_id
          WHERE a.pop_id = $1
            AND a.status IN ('open', 'acknowledged')
          ORDER BY a.created_at DESC
          LIMIT 10
        `,
        [id]
      )
    );

    return res.json({
      pop: {
        id: popRow.id,
        providerId: popRow.provider_id,
        providerName: popRow.provider_name,
        name: popRow.name,
        city: popRow.city,
        status,
        uplinkCapacity: popRow.uplink_capacity,
        utilization: popRow.utilization_percent,
        latency: popRow.latency_ms
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: Number(popRow.devices_offline || 0),
        degraded: degradedDevices
      },
      traffic: {
        current,
        series
      },
      topDevices,
      alerts: alertsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        severity: row.severity,
        status: row.status,
        createdAt: row.created_at,
        alertType: row.alert_type,
        deviceName: row.device_name || row.serial_number,
        customerName: row.customer_name
      })),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao monitorar POP:', error);
    return res.status(500).json({ error: 'Failed to fetch POP monitoring' });
  }
});

// GET /api/pops/:id - Get POP details
router.get('/:id', requirePermission('pops.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT p.*,
                 COUNT(DISTINCT d.id) AS devices_count,
                 COUNT(DISTINCT c.id) AS customers_count
          FROM pops p
          LEFT JOIN devices d ON d.pop_id = p.id
          LEFT JOIN customers c ON c.pop_id = p.id
          WHERE p.id = $1
          GROUP BY p.id
          LIMIT 1
        `,
        [id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'POP not found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      name: row.name,
      location: row.city,
      address: row.address,
      status: mapStatus(row.status),
      devices: Number(row.devices_count || 0),
      customers: Number(row.customers_count || 0),
      utilization: row.utilization_percent,
      latency: row.latency_ms,
      uplink: row.uplink_capacity,
      coordinates: {
        lat: row.latitude,
        lng: row.longitude
      }
    });
  } catch (error) {
    console.error('Erro ao buscar POP:', error);
    return res.status(500).json({ error: 'Failed to fetch POP' });
  }
});

// POST /api/pops - Create POP
router.post('/', requirePermission('pops.create'), async (req, res) => {
  try {
    const payload = req.body || {};
    const name = payload.name;
    const city = payload.city || payload.location;

    if (!name) {
      return res.status(400).json({ error: 'Nome do POP é obrigatório.' });
    }

    const slug = payload.slug || name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO pops (
            provider_id, name, slug, address, city, country, latitude, longitude,
            status, uplink_capacity, utilization_percent, latency_ms
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12
          )
          RETURNING *
        `,
        [
          req.tenantId,
          name,
          slug,
          payload.address || null,
          city || null,
          payload.country || 'Brasil',
          payload.latitude || null,
          payload.longitude || null,
          payload.status || 'online',
          payload.uplink || payload.uplinkCapacity || null,
          parsePercent(payload.utilization || payload.utilizationPercent),
          payload.latency || payload.latencyMs || null
        ]
      )
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar POP:', error);
    return res.status(500).json({ error: 'Failed to create POP' });
  }
});

// PUT /api/pops/:id - Update POP
router.put('/:id', requirePermission('pops.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const fields = [];
    const values = [];
    let idx = 1;

    const mapField = (column, value) => {
      if (value === undefined) return;
      fields.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    mapField('name', payload.name);
    mapField('address', payload.address);
    mapField('city', payload.city || payload.location);
    mapField('country', payload.country);
    mapField('latitude', payload.latitude);
    mapField('longitude', payload.longitude);
    mapField('status', payload.status);
    mapField('uplink_capacity', payload.uplink || payload.uplinkCapacity);
    mapField('utilization_percent', parsePercent(payload.utilization || payload.utilizationPercent));
    mapField('latency_ms', payload.latency || payload.latencyMs);

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(id);
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE pops
          SET ${fields.join(', ')}, updated_at = NOW()
          WHERE id = $${idx}
          RETURNING *
        `,
        values
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'POP not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar POP:', error);
    return res.status(500).json({ error: 'Failed to update POP' });
  }
});

// DELETE /api/pops/:id - Delete POP
router.delete('/:id', requirePermission('pops.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query('DELETE FROM pops WHERE id = $1 RETURNING id', [id])
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'POP not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir POP:', error);
    return res.status(500).json({ error: 'Failed to delete POP' });
  }
});

module.exports = router;
