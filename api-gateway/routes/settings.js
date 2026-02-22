const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

const defaultSettings = {
  general: {
    companyName: 'OctoISP',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    language: 'pt-BR',
    logoUrl: ''
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    telegramEnabled: true,
    webhookEnabled: false,
    alertThreshold: 'warning',
    notifyWindow: '24x7'
  },
  monitoring: {
    snmpCommunity: 'public',
    snmpVersion: '2c',
    pollingInterval: 300,
    metricsInterval: 60,
    retentionDays: 30
  },
  security: {
    sessionTimeout: 3600,
    passwordPolicy: 'strong',
    twoFactorEnabled: false,
    ipAllowlist: ''
  },
  alerting: {
    autoAcknowledgeMinutes: 0,
    dedupWindowMinutes: 10,
    escalationMinutes: 30,
    maintenanceWindow: 'Dom 00:00-04:00'
  },
  sla: {
    targetAvailability: 99.9,
    maxResponseMs: 150,
    outageThresholdMinutes: 5
  },
  integrations: {
    supabaseUrl:
      process.env.SUPABASE_URL ||
      (process.env.NODE_ENV === 'preview' ? 'http://supabase-preview:8000' : ''),
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
    grafanaUrl: process.env.GRAFANA_URL || '',
    telegramChatId: '',
    webhookUrl: '',
    apiConnections: []
  }
};

const mergeSettings = (base, incoming) => ({
  general: { ...base.general, ...(incoming.general || {}) },
  notifications: { ...base.notifications, ...(incoming.notifications || {}) },
  monitoring: { ...base.monitoring, ...(incoming.monitoring || {}) },
  security: { ...base.security, ...(incoming.security || {}) },
  alerting: { ...base.alerting, ...(incoming.alerting || {}) },
  sla: { ...base.sla, ...(incoming.sla || {}) },
  integrations: { ...base.integrations, ...(incoming.integrations || {}) }
});

const MAX_LOGO_CHARS = 3_000_000;

const sanitizeLogoUrl = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (['http:', 'https:'].includes(parsed.protocol)) return trimmed;
  } catch {
    return '';
  }
  return '';
};

const sanitizeGeneral = (general) => {
  const logoUrl = sanitizeLogoUrl(general?.logoUrl || '');
  return {
    ...general,
    logoUrl
  };
};

const maskSecret = (value) => {
  if (!value) return '';
  const tail = value.slice(-4);
  return `********${tail}`;
};

const isMasked = (value) => typeof value === 'string' && value.startsWith('********');

const applySecretUpdates = (current, incoming) => {
  const next = { ...current, ...incoming };
  if (isMasked(incoming.supabaseAnonKey)) {
    next.supabaseAnonKey = current.supabaseAnonKey;
  }
  if (isMasked(incoming.supabaseServiceRoleKey)) {
    next.supabaseServiceRoleKey = current.supabaseServiceRoleKey;
  }
  return next;
};

const buildSafeSettings = (settings) => ({
  ...settings,
  general: sanitizeGeneral(settings.general || {}),
  integrations: {
    ...settings.integrations,
    supabaseAnonKey: settings.integrations.supabaseAnonKey
      ? maskSecret(settings.integrations.supabaseAnonKey)
      : '',
    supabaseServiceRoleKey: settings.integrations.supabaseServiceRoleKey
      ? maskSecret(settings.integrations.supabaseServiceRoleKey)
      : ''
  }
});

// GET /api/settings - Get system settings
router.get('/', requirePermission('settings.manage'), async (req, res) => {
  try {
    const providerId = req.tenantId;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        'SELECT settings FROM provider_settings WHERE provider_id = $1 LIMIT 1',
        [providerId]
      )
    );

    if (!result.rowCount) {
      const created = await withUser(req.user.id, (client) =>
        client.query(
          'INSERT INTO provider_settings (provider_id, settings) VALUES ($1, $2) RETURNING settings',
          [providerId, defaultSettings]
        )
      );
      return res.json(buildSafeSettings(created.rows[0].settings));
    }

    const settings = mergeSettings(defaultSettings, result.rows[0].settings || {});
    return res.json(buildSafeSettings(settings));
  } catch (error) {
    console.error('Erro ao carregar settings:', error);
    return res.status(500).json({ error: 'Falha ao carregar configurações.' });
  }
});

// PUT /api/settings - Update settings
router.put('/', requirePermission('settings.manage'), async (req, res) => {
  try {
    const providerId = req.tenantId;
    const existingResult = await withUser(req.user.id, (client) =>
      client.query('SELECT settings FROM provider_settings WHERE provider_id = $1 LIMIT 1', [
        providerId
      ])
    );
    const existingSettings = mergeSettings(
      defaultSettings,
      existingResult.rows[0]?.settings || {}
    );

    const incoming = mergeSettings(defaultSettings, req.body || {});
    if (incoming.general?.logoUrl && incoming.general.logoUrl.length > MAX_LOGO_CHARS) {
      return res.status(413).json({ error: 'Logomarca muito grande.' });
    }
    incoming.general = sanitizeGeneral(incoming.general || {});
    const safeIntegrations = applySecretUpdates(
      existingSettings.integrations,
      incoming.integrations
    );
    const merged = {
      ...incoming,
      integrations: safeIntegrations
    };

    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO provider_settings (provider_id, settings)
          VALUES ($1, $2)
          ON CONFLICT (provider_id)
          DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()
          RETURNING settings, updated_at
        `,
        [providerId, merged]
      )
    );

    return res.json({
      ...buildSafeSettings(result.rows[0].settings),
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error('Erro ao salvar settings:', error);
    return res.status(500).json({ error: 'Falha ao salvar configurações.' });
  }
});

// POST /api/settings/test-notification - Simulate notification test
router.post('/test-notification', requirePermission('settings.manage'), async (req, res) => {
  try {
    const providerId = req.tenantId;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        'SELECT settings FROM provider_settings WHERE provider_id = $1 LIMIT 1',
        [providerId]
      )
    );

    const settings = mergeSettings(defaultSettings, result.rows[0]?.settings || {});
    return res.json({
      success: true,
      channels: ['email', 'push', 'telegram'].filter((channel) => {
        if (channel === 'email') return settings.notifications.emailEnabled;
        if (channel === 'push') return settings.notifications.pushEnabled;
        if (channel === 'telegram') return settings.notifications.telegramEnabled;
        return false;
      }),
      message: 'Notificação de teste enviada.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao testar notificação:', error);
    return res.status(500).json({ error: 'Erro ao enviar notificação.' });
  }
});

// POST /api/settings/test-connection - Validate external integration URLs
router.post('/test-connection', requirePermission('settings.manage'), async (req, res) => {
  try {
    const { url, method = 'GET', payload } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória.' });
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL inválida.' });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Protocolo não permitido.' });
    }

    const allowlist = (process.env.INTEGRATION_ALLOWLIST || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (allowlist.length) {
      const allowed = allowlist.some((domain) => parsed.hostname.endsWith(domain));
      if (!allowed) {
        return res.status(403).json({ error: 'Host não permitido para teste.' });
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: method === 'POST' ? JSON.stringify(payload || {}) : undefined,
      signal: controller.signal
    });
    clearTimeout(timeout);

    return res.json({
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - start
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao testar conexão.' });
  }
});

module.exports = router;
