const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { queryMetricsAsUser, withMetricsUser } = require('../metrics');
const { requirePermission } = require('../middleware/requirePermission');

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

const rangeMap = {
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days'
};

const bucketMap = {
  '1h': '5 minutes',
  '6h': '30 minutes',
  '24h': '2 hours',
  '7d': '1 day',
  '30d': '1 day'
};

const resolveRange = (value, fallback) => rangeMap[value] || fallback;
const resolveBucket = (value, fallback) => bucketMap[value] || fallback;

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

// GET /api/network/summary
router.get('/summary', requirePermission('devices.view'), async (req, res) => {
  try {
    const providerId =
      req.role === 'admin_global' && req.query.providerId ? req.query.providerId : req.tenantId;
    const range = resolveRange(req.query.range, '2 hours');

    const [deviceStats, alertStats, latencyStats] = await Promise.all([
      withScopedUser(req, (client) =>
        client.query(
          `
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'online') AS online,
              COUNT(*) FILTER (WHERE status = 'offline') AS offline
            FROM devices
            WHERE provider_id = $1
          `,
          [providerId]
        )
      ),
      withScopedUser(req, (client) =>
        client.query(
          `
            SELECT
              COUNT(*) FILTER (WHERE status = 'open' AND severity = 'critical') AS critical_open
            FROM alerts
            WHERE provider_id = $1
          `,
          [providerId]
        )
      ),
      queryMetrics(
        req,
        `
          SELECT
            AVG(latency_ms) AS avg_latency,
            AVG(packet_loss) AS avg_packet_loss
          FROM device_metrics
          WHERE provider_id = $1
            AND time >= NOW() - INTERVAL '${range}'
        `,
        [providerId]
      )
    ]);

    const totalDevices = Number(deviceStats.rows[0].total || 0);
    const onlineDevices = Number(deviceStats.rows[0].online || 0);
    const availability = totalDevices ? (onlineDevices / totalDevices) * 100 : 0;

    const avgLatency = toNumber(latencyStats.rows[0]?.avg_latency);
    const avgPacketLoss = toNumber(latencyStats.rows[0]?.avg_packet_loss);

    return res.json({
      availability: Number(availability.toFixed(2)),
      avgLatencyMs: avgLatency ? Number(avgLatency.toFixed(2)) : null,
      packetLoss: avgPacketLoss ? Number(avgPacketLoss.toFixed(2)) : null,
      criticalLinks: Number(alertStats.rows[0].critical_open || 0)
    });
  } catch (error) {
    console.error('Erro ao carregar resumo de rede:', error);
    return res.status(500).json({ error: 'Failed to fetch network summary' });
  }
});

// GET /api/network/latency
router.get('/latency', requirePermission('devices.view'), async (req, res) => {
  try {
    const providerId =
      req.role === 'admin_global' && req.query.providerId ? req.query.providerId : req.tenantId;
    const range = resolveRange(req.query.range, '24 hours');
    const bucket = resolveBucket(req.query.range, '4 hours');

    const deviceResult = await withScopedUser(req, (client) =>
      client.query('SELECT id, device_type FROM devices WHERE provider_id = $1', [providerId])
    );

    const coreTypes = new Set(['router', 'switch', 'olt', 'ap', 'core']);
    const coreIds = deviceResult.rows
      .filter((row) => coreTypes.has((row.device_type || '').toLowerCase()))
      .map((row) => row.id);
    const accessIds = deviceResult.rows
      .filter((row) => !coreTypes.has((row.device_type || '').toLowerCase()))
      .map((row) => row.id);

    const coreList = coreIds.length ? coreIds : deviceResult.rows.map((row) => row.id);
    const accessList = accessIds.length ? accessIds : deviceResult.rows.map((row) => row.id);

    const latencySeries = await queryMetrics(
      req,
      `
        SELECT
          time_bucket('${bucket}', time) AS bucket,
          AVG(latency_ms) FILTER (WHERE device_id = ANY($2::uuid[])) AS core_latency,
          AVG(latency_ms) FILTER (WHERE device_id = ANY($3::uuid[])) AS access_latency
        FROM device_metrics
        WHERE provider_id = $1
          AND time >= NOW() - INTERVAL '${range}'
        GROUP BY bucket
        ORDER BY bucket
      `,
      [providerId, coreList, accessList]
    );

    return res.json({
      series: latencySeries.rows.map((row) => ({
        time: row.bucket,
        core: toNumber(row.core_latency),
        backbone: toNumber(row.access_latency)
      }))
    });
  } catch (error) {
    console.error('Erro ao carregar latência:', error);
    return res.status(500).json({ error: 'Failed to fetch latency data' });
  }
});

module.exports = router;
