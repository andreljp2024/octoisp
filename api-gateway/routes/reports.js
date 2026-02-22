const express = require('express');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const router = express.Router();
const { withUser } = require('../db');
const { queryMetricsAsUser, withMetricsUser } = require('../metrics');
const { requirePermission } = require('../middleware/requirePermission');

const bytesToTb = (bytes) => `${(bytes / (1024 ** 4)).toFixed(2)} TB`;

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

// GET /api/reports - List available reports
router.get('/', requirePermission('reports.view'), (req, res) => {
  res.json({
    reports: [
      {
        id: 'report-001',
        name: 'Relatório de Dispositivos',
        type: 'devices',
        description: 'Relatório completo de todos os dispositivos',
        lastGenerated: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'report-002',
        name: 'Relatório de Clientes',
        type: 'customers',
        description: 'Relatório de clientes ativos',
        lastGenerated: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'report-003',
        name: 'Relatório de Alertas',
        type: 'alerts',
        description: 'Histórico de alertas',
        lastGenerated: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 'report-004',
        name: 'Relatório de Rede',
        type: 'network',
        description: 'Resumo de disponibilidade, latência e perda',
        lastGenerated: new Date(Date.now() - 21600000).toISOString()
      }
    ]
  });
});

// GET /api/reports/dashboard - Dashboard statistics
router.get('/dashboard', requirePermission('reports.view'), async (req, res) => {
  try {
    const [deviceStats, customerStats, alertStats] = await Promise.all([
      withUser(req.user.id, (client) =>
        client.query(
          `
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'online') AS online,
              COUNT(*) FILTER (WHERE status = 'offline') AS offline
            FROM devices
          `
        )
      ),
      withUser(req.user.id, (client) =>
        client.query('SELECT COUNT(*) AS total FROM customers')
      ),
      withUser(req.user.id, (client) =>
        client.query(
          `
            SELECT
              COUNT(*) FILTER (WHERE status = 'open') AS open,
              COUNT(*) FILTER (WHERE severity = 'critical') AS critical,
              COUNT(*) FILTER (WHERE severity = 'warning') AS warning
            FROM alerts
          `
        )
      )
    ]);

    const trafficStats = await queryMetricsAsUser(
      req.user.id,
      `
        SELECT
          SUM((traffic_in_bps + traffic_out_bps) / 8) AS bytes_total,
          MIN(time) AS start_time,
          MAX(time) AS end_time
        FROM device_metrics
        WHERE provider_id = $1
          AND time >= NOW() - INTERVAL '1 day'
      `,
      [req.tenantId]
    );

    const bytesToday = Number(trafficStats.rows[0]?.bytes_total || 0);

    const totalDevices = Number(deviceStats.rows[0].total || 0);
    const onlineDevices = Number(deviceStats.rows[0].online || 0);
    const offlineDevices = Number(deviceStats.rows[0].offline || 0);
    const uptime = totalDevices ? Number(((onlineDevices / totalDevices) * 100).toFixed(2)) : 0;

    return res.json({
      totalDevices,
      onlineDevices,
      offlineDevices,
      uptime,
      totalCustomers: Number(customerStats.rows[0].total || 0),
      activeAlerts: Number(alertStats.rows[0].open || 0),
      criticalAlerts: Number(alertStats.rows[0].critical || 0),
      warningAlerts: Number(alertStats.rows[0].warning || 0),
      dataUsage: {
        today: bytesToTb(bytesToday),
        thisWeek: 'N/D',
        thisMonth: 'N/D'
      },
      topTalkers: []
    });
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    return res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// GET /api/reports/traffic - Weekly traffic aggregate
router.get('/traffic', requirePermission('reports.view'), async (req, res) => {
  try {
    const result = await queryMetricsAsUser(
      req.user.id,
      `
        SELECT
          time_bucket('1 day', time) AS day,
          AVG(traffic_in_bps) AS avg_in_bps,
          AVG(traffic_out_bps) AS avg_out_bps
        FROM device_metrics
        WHERE provider_id = $1
          AND time >= NOW() - INTERVAL '7 days'
        GROUP BY day
        ORDER BY day
      `,
      [req.tenantId]
    );

    return res.json({
      data: result.rows.map((row) => ({
        day: row.day,
        downloadMbps: Number(row.avg_in_bps || 0) / 1_000_000,
        uploadMbps: Number(row.avg_out_bps || 0) / 1_000_000
      }))
    });
  } catch (error) {
    console.error('Erro ao carregar tráfego:', error);
    return res.status(500).json({ error: 'Failed to load traffic' });
  }
});

// GET /api/reports/schedules
router.get('/schedules', requirePermission('reports.view'), async (req, res) => {
  try {
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT id, name, report_type, format, next_run, status
          FROM report_schedules
          ORDER BY next_run ASC
        `
      )
    );

    return res.json({
      schedules: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.report_type,
        format: row.format,
        next: row.next_run,
        status: row.status
      })),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// POST /api/reports/schedules
router.post('/schedules', requirePermission('reports.generate'), async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name || !payload.next || !payload.type) {
      return res.status(400).json({ error: 'Nome, tipo e data são obrigatórios.' });
    }

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO report_schedules (provider_id, name, report_type, format, next_run, status, created_by)
          VALUES ($1, $2, $3, $4, $5, 'active', $6)
          RETURNING id, name, report_type, format, next_run, status
        `,
        [
          req.tenantId,
          payload.name,
          payload.type,
          payload.format || 'PDF',
          payload.next,
          req.user.id
        ]
      )
    );

    return res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      type: result.rows[0].report_type,
      format: result.rows[0].format,
      next: result.rows[0].next_run,
      status: result.rows[0].status
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// DELETE /api/reports/schedules/:id
router.delete('/schedules/:id', requirePermission('reports.generate'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query('DELETE FROM report_schedules WHERE id = $1 RETURNING id', [id])
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

const buildReportData = async (type, req, providerId) => {
  if (type === 'devices') {
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT serial_number, vendor, model, status, wan_ip, last_contact
          FROM devices
          WHERE provider_id = $1
          ORDER BY created_at DESC
        `,
        [providerId]
      )
    );
    return result.rows;
  }

  if (type === 'customers') {
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT name, email, phone, status, plan_name, last_billing_date
          FROM customers
          WHERE provider_id = $1
          ORDER BY created_at DESC
        `,
        [providerId]
      )
    );
    return result.rows;
  }

  if (type === 'alerts') {
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT title, severity, status, created_at
          FROM alerts
          WHERE provider_id = $1
          ORDER BY created_at DESC
        `,
        [providerId]
      )
    );
    return result.rows;
  }

  const metrics = await queryMetrics(
    req,
    `
      SELECT time, device_id, cpu_percent, mem_percent, traffic_in_bps, traffic_out_bps, latency_ms
      FROM device_metrics
      WHERE provider_id = $1
      ORDER BY time DESC
      LIMIT 200
    `,
    [providerId]
  );
  return metrics.rows;
};

const buildNetworkReport = async (req, providerId) => {
  const [deviceStats, alertStats, latencyStats] = await Promise.all([
    withScopedUser(req, (client) =>
      client.query(
        `
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'online') AS online
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
          AND time >= NOW() - INTERVAL '2 hours'
      `,
      [providerId]
    )
  ]);

  const totalDevices = Number(deviceStats.rows[0]?.total || 0);
  const onlineDevices = Number(deviceStats.rows[0]?.online || 0);
  const availability = totalDevices ? (onlineDevices / totalDevices) * 100 : 0;
  const avgLatency = Number(latencyStats.rows[0]?.avg_latency || 0);
  const avgPacketLoss = Number(latencyStats.rows[0]?.avg_packet_loss || 0);

  const summaryRow = {
    section: 'summary',
    availability_percent: Number(availability.toFixed(2)),
    avg_latency_ms: Number(avgLatency.toFixed(2)),
    avg_packet_loss_percent: Number(avgPacketLoss.toFixed(2)),
    critical_links: Number(alertStats.rows[0]?.critical_open || 0)
  };

  const deviceResult = await withScopedUser(req, (client) =>
    client.query('SELECT id, device_type FROM devices WHERE provider_id = $1', [providerId])
  );

  if (!deviceResult.rowCount) {
    return [summaryRow];
  }

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
        time_bucket('2 hours', time) AS bucket,
        AVG(latency_ms) FILTER (WHERE device_id = ANY($2::uuid[])) AS core_latency,
        AVG(latency_ms) FILTER (WHERE device_id = ANY($3::uuid[])) AS access_latency
      FROM device_metrics
      WHERE provider_id = $1
        AND time >= NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket
    `,
    [providerId, coreList, accessList]
  );

  const seriesRows = latencySeries.rows.map((row) => ({
    section: 'latency_series',
    time: row.bucket,
    core_latency_ms: Number(row.core_latency || 0),
    access_latency_ms: Number(row.access_latency || 0)
  }));

  return [summaryRow, ...seriesRows];
};

// POST /api/reports/export
router.post('/export', requirePermission('reports.generate'), async (req, res) => {
  try {
    const payload = req.body || {};
    const type = payload.type || 'devices';
    const format = (payload.format || 'PDF').toUpperCase();

    const providerId =
      req.role === 'admin_global' && payload.providerId ? payload.providerId : req.tenantId;
    const data =
      type === 'network'
        ? await buildNetworkReport(req, providerId)
        : await buildReportData(type, req, providerId);

    await withScopedUser(req, (client) =>
      client.query(
        `
          INSERT INTO report_runs (provider_id, report_type, format, status, output_path)
          VALUES ($1, $2, $3, 'generated', $4)
        `,
        [providerId, type, format, null]
      )
    );

    if (format === 'CSV') {
      const parser = new Parser({ fields: data[0] ? Object.keys(data[0]) : [] });
      const csv = parser.parse(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=octoisp-${type}.csv`);
      return res.send(csv);
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=octoisp-${type}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).text(`Relatório OctoISP - ${type.toUpperCase()}`, { align: 'left' });
    doc.moveDown();

    if (!data.length) {
      doc.fontSize(12).text('Nenhum dado disponível.');
    } else {
      data.slice(0, 200).forEach((row) => {
        doc.fontSize(10).text(JSON.stringify(row));
        doc.moveDown(0.3);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return res.status(500).json({ error: 'Failed to export report' });
  }
});

module.exports = router;
