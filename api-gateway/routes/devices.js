const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { queryMetricsAsUser } = require('../metrics');
const { requirePermission } = require('../middleware/requirePermission');

const withScopedUser = (req, handler) =>
  withUser(req.user.id, async (client) => {
    if (req.role === 'admin_global') {
      await client.query('SET LOCAL row_security = off');
    }
    return handler(client);
  });

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const hashSeed = (value) =>
  value
    .toString()
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

const buildInterfaces = (deviceRow) => {
  const type = (deviceRow.device_type || 'cpe').toLowerCase();
  const base =
    type === 'router' || type === 'switch' || type === 'olt' || type === 'core'
      ? [
          { name: 'ge-0/0/0', description: 'Uplink principal', speedMbps: 10000 },
          { name: 'ge-0/0/1', description: 'Distribuição', speedMbps: 1000 },
          { name: 'xe-0/0/0', description: 'Backbone', speedMbps: 10000 },
          { name: 'mgmt0', description: 'Gerência', speedMbps: 100 },
        ]
      : type === 'ap'
      ? [
          { name: 'uplink', description: 'Uplink', speedMbps: 1000 },
          { name: 'ssid-2g', description: 'WiFi 2.4G', speedMbps: 600 },
          { name: 'ssid-5g', description: 'WiFi 5G', speedMbps: 1200 },
        ]
      : [
          { name: 'wan', description: 'WAN', speedMbps: 1000 },
          { name: 'lan1', description: 'LAN 1', speedMbps: 1000 },
          { name: 'lan2', description: 'LAN 2', speedMbps: 1000 },
          { name: 'wifi-2g', description: 'WiFi 2.4G', speedMbps: 300 },
          { name: 'wifi-5g', description: 'WiFi 5G', speedMbps: 866 },
        ];

  return base.map((iface, index) => {
    const seed = hashSeed(`${deviceRow.id}-${iface.name}-${index}`);
    const utilization = Math.round(seededRandom(seed) * 85);
    const rxMbps = Math.round(utilization * (iface.speedMbps / 100) * 0.7);
    const txMbps = Math.round(utilization * (iface.speedMbps / 100) * 0.5);
    const status = utilization > 5 ? 'up' : 'down';
    return {
      name: iface.name,
      description: iface.description,
      status,
      speedMbps: iface.speedMbps,
      rxMbps,
      txMbps,
      utilizationPercent: utilization,
      errors: Math.round(seededRandom(seed + 11) * 12),
      lastChange: new Date(Date.now() - seededRandom(seed + 7) * 3600 * 1000).toISOString(),
    };
  });
};

const buildInterfaceSeries = (seed, points = 72) => {
  const now = Date.now();
  return Array.from({ length: points }).map((_, idx) => {
    const timestamp = new Date(now - (points - idx) * 5 * 60 * 1000);
    const base = 30 + seededRandom(seed + idx) * 50;
    const rx = Math.max(0, base + seededRandom(seed + idx * 2) * 20);
    const tx = Math.max(0, base * 0.7 + seededRandom(seed + idx * 3) * 15);
    const util = Math.min(100, Math.round((rx + tx) / 2));
    return {
      time: timestamp.toISOString(),
      rxMbps: Number(rx.toFixed(2)),
      txMbps: Number(tx.toFixed(2)),
      utilization: util,
      errors: Math.round(seededRandom(seed + idx * 4) * 6),
    };
  });
};

const mapDeviceRow = (row) => ({
  id: row.id,
  name: row.display_name || row.serial_number,
  serialNumber: row.serial_number,
  type: row.device_type || 'cpe',
  model: row.model,
  vendor: row.vendor,
  status: row.status,
  ipAddress: row.wan_ip || row.lan_ip,
  customer: row.customer_name,
  location: row.pop_name || row.location,
  lastSeen: row.last_contact || row.updated_at || row.created_at
});

// GET /api/devices - List all devices
router.get('/', requirePermission('devices.view'), async (req, res) => {
  try {
    const providerId =
      req.role === 'admin_global' && req.query.providerId ? req.query.providerId : req.tenantId;
    const filters = ['d.provider_id = $1'];
    const values = [providerId];
    let idx = 2;

    if (req.query.popId) {
      filters.push(`d.pop_id = $${idx}`);
      values.push(req.query.popId);
      idx += 1;
    }

    if (req.query.customerId) {
      filters.push(`d.customer_id = $${idx}`);
      values.push(req.query.customerId);
      idx += 1;
    }

    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT d.*,
                 COALESCE(d.notes, d.serial_number) AS display_name,
                 c.name AS customer_name,
                 p.name AS pop_name
          FROM devices d
          LEFT JOIN customers c ON c.id = d.customer_id
          LEFT JOIN pops p ON p.id = d.pop_id
          WHERE ${filters.join(' AND ')}
          ORDER BY d.created_at DESC
        `,
        values
      )
    );

    return res.json({
      devices: result.rows.map(mapDeviceRow),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// GET /api/devices/:id - Get device details
router.get('/:id', requirePermission('devices.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT d.*,
                 COALESCE(d.notes, d.serial_number) AS display_name,
                 c.name AS customer_name,
                 p.name AS pop_name
          FROM devices d
          LEFT JOIN customers c ON c.id = d.customer_id
          LEFT JOIN pops p ON p.id = d.pop_id
          WHERE d.id = $1
          LIMIT 1
        `,
        [id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.json(mapDeviceRow(result.rows[0]));
  } catch (error) {
    console.error('Error fetching device:', error);
    return res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// GET /api/devices/:id/interfaces - List interfaces for device
router.get('/:id/interfaces', requirePermission('devices.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT d.id,
                 d.serial_number,
                 d.device_type,
                 d.model,
                 d.vendor,
                 d.pop_id,
                 d.customer_id,
                 c.name AS customer_name,
                 p.name AS pop_name
          FROM devices d
          LEFT JOIN customers c ON c.id = d.customer_id
          LEFT JOIN pops p ON p.id = d.pop_id
          WHERE d.id = $1
          LIMIT 1
        `,
        [id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = result.rows[0];
    const interfaces = buildInterfaces(device);

    return res.json({
      device: {
        id: device.id,
        name: device.serial_number || device.model || device.vendor,
        type: device.device_type,
        customerName: device.customer_name,
        popName: device.pop_name
      },
      interfaces
    });
  } catch (error) {
    console.error('Error fetching interfaces:', error);
    return res.status(500).json({ error: 'Failed to fetch interfaces' });
  }
});

// GET /api/devices/:id/interfaces/:iface/metrics - Interface metrics series
router.get('/:id/interfaces/:iface/metrics', requirePermission('devices.view'), async (req, res) => {
  try {
    const { id, iface } = req.params;
    const seed = hashSeed(`${id}-${iface}`);
    const series = buildInterfaceSeries(seed, 72);
    return res.json({
      interface: iface,
      series
    });
  } catch (error) {
    console.error('Error fetching interface metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch interface metrics' });
  }
});

// POST /api/devices - Create new device
router.post('/', requirePermission('devices.create'), async (req, res) => {
  try {
    const payload = req.body || {};
    const serialNumber = payload.serialNumber || payload.serial_number || `AUTO-${Date.now()}`;
    const oui = payload.oui || (payload.macAddress ? payload.macAddress.replace(/:/g, '').slice(0, 6) : '000000');

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO devices (
            provider_id, customer_id, pop_id, serial_number, oui, product_class,
            software_version, hardware_version, wan_ip, lan_ip, mac_address,
            optical_rx_power, optical_tx_power, uptime, last_contact,
            connection_type, device_type, vendor, model, status, location, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22
          )
          RETURNING *
        `,
        [
          req.tenantId,
          payload.customerId || null,
          payload.popId || null,
          serialNumber,
          oui,
          payload.productClass || null,
          payload.softwareVersion || null,
          payload.hardwareVersion || null,
          payload.ipAddress || payload.wanIp || null,
          payload.lanIp || null,
          payload.macAddress || null,
          payload.opticalRxPower || null,
          payload.opticalTxPower || null,
          payload.uptime || null,
          payload.lastContact || null,
          payload.connectionType || 'ethernet',
          payload.type || payload.deviceType || 'cpe',
          payload.vendor || null,
          payload.model || null,
          payload.status || 'offline',
          payload.location || null,
          payload.name || payload.notes || null
        ]
      )
    );

    return res.status(201).json(mapDeviceRow(result.rows[0]));
  } catch (error) {
    console.error('Error creating device:', error);
    return res.status(500).json({ error: 'Failed to create device' });
  }
});

// PUT /api/devices/:id - Update device
router.put('/:id', requirePermission('devices.edit'), async (req, res) => {
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

    mapField('customer_id', payload.customerId);
    mapField('pop_id', payload.popId);
    mapField('product_class', payload.productClass);
    mapField('software_version', payload.softwareVersion);
    mapField('hardware_version', payload.hardwareVersion);
    mapField('wan_ip', payload.ipAddress || payload.wanIp);
    mapField('lan_ip', payload.lanIp);
    mapField('mac_address', payload.macAddress);
    mapField('optical_rx_power', payload.opticalRxPower);
    mapField('optical_tx_power', payload.opticalTxPower);
    mapField('uptime', payload.uptime);
    mapField('last_contact', payload.lastContact);
    mapField('connection_type', payload.connectionType);
    mapField('device_type', payload.type || payload.deviceType);
    mapField('vendor', payload.vendor);
    mapField('model', payload.model);
    mapField('status', payload.status);
    mapField('location', payload.location);
    mapField('notes', payload.name || payload.notes);

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(id);

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE devices
          SET ${fields.join(', ')}, updated_at = NOW()
          WHERE id = $${idx}
          RETURNING *
        `,
        values
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.json(mapDeviceRow(result.rows[0]));
  } catch (error) {
    console.error('Error updating device:', error);
    return res.status(500).json({ error: 'Failed to update device' });
  }
});

// DELETE /api/devices/:id - Delete device
router.delete('/:id', requirePermission('devices.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query('DELETE FROM devices WHERE id = $1 RETURNING id', [id])
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting device:', error);
    return res.status(500).json({ error: 'Failed to delete device' });
  }
});

// GET /api/devices/:id/metrics - Device metrics (TimescaleDB)
router.get('/:id/metrics', requirePermission('devices.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = await queryMetricsAsUser(
      req.user.id,
      `
        SELECT time, cpu_percent, mem_percent, traffic_in_bps, traffic_out_bps,
               latency_ms, packet_loss, temperature_c
        FROM device_metrics
        WHERE device_id = $1 AND provider_id = $2
        ORDER BY time DESC
        LIMIT 288
      `,
      [id, req.tenantId]
    );

    return res.json({
      deviceId: id,
      metrics: metrics.rows.reverse(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching device metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch device metrics' });
  }
});

// POST /api/devices/:id/command - Queue TR-069 command
router.post('/:id/command', requirePermission('devices.execute_commands'), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO command_queue (provider_id, device_id, command, payload, status, priority)
          VALUES ($1, $2, $3, $4, 'queued', $5)
          RETURNING *
        `,
        [req.tenantId, id, payload.command || 'custom', payload.payload || {}, payload.priority || 0]
      )
    );

    return res.json({
      deviceId: id,
      command: result.rows[0].command,
      status: result.rows[0].status,
      queuedAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error sending command to device:', error);
    return res.status(500).json({ error: 'Failed to send command to device' });
  }
});

module.exports = router;
