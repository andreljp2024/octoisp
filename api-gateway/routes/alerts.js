const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

const withScopedUser = (req, handler) =>
  withUser(req.user.id, async (client) => {
    if (req.role === 'admin_global') {
      await client.query('SET LOCAL row_security = off');
    }
    return handler(client);
  });

// GET /api/alerts - List all alerts
router.get('/', requirePermission('alerts.view'), async (req, res) => {
  try {
    const providerId =
      req.role === 'admin_global' && req.query.providerId ? req.query.providerId : req.tenantId;
    const result = await withScopedUser(req, (client) =>
      client.query(
        `
          SELECT a.*, d.serial_number, d.model, d.vendor
          FROM alerts a
          LEFT JOIN devices d ON d.id = a.device_id
          WHERE a.provider_id = $1
          ORDER BY a.created_at DESC
        `,
        [providerId]
      )
    );

    const alerts = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      severity: row.severity,
      deviceId: row.device_id,
      deviceName: row.serial_number || row.model || row.vendor || row.device_id,
      alertType: row.alert_type,
      status: row.status,
      timestamp: row.created_at
    }));

    const counters = alerts.reduce(
      (acc, alert) => {
        acc.total += 1;
        if (alert.status === 'open') acc.open += 1;
        if (alert.status === 'acknowledged') acc.acknowledged += 1;
        if (alert.status === 'resolved') acc.resolved += 1;
        return acc;
      },
      { total: 0, open: 0, acknowledged: 0, resolved: 0 }
    );

    return res.json({
      alerts,
      total: counters.total,
      open: counters.open,
      acknowledged: counters.acknowledged,
      resolved: counters.resolved
    });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts/:id/acknowledge - Acknowledge alert
router.post('/:id/acknowledge', requirePermission('alerts.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE alerts
          SET status = 'acknowledged',
              acknowledged_at = NOW(),
              acknowledged_by = $2,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [id, req.user.id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      status: row.status,
      acknowledgedAt: row.acknowledged_at,
      acknowledgedBy: row.acknowledged_by
    });
  } catch (error) {
    console.error('Erro ao reconhecer alerta:', error);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/alerts/:id/resolve - Resolve alert
router.post('/:id/resolve', requirePermission('alerts.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE alerts
          SET status = 'resolved',
              resolved_at = NOW(),
              resolved_by = $2,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [id, req.user.id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      status: row.status,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by
    });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    return res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', requirePermission('alerts.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query('DELETE FROM alerts WHERE id = $1 RETURNING id', [id])
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir alerta:', error);
    return res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
