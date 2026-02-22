import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheckIcon,
  BellAlertIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  KeyIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const defaultSettings = {
  general: {
    companyName: 'OctoISP',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    language: 'pt-BR',
    logoUrl: '',
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    telegramEnabled: true,
    webhookEnabled: false,
    alertThreshold: 'warning',
    notifyWindow: '24x7',
  },
  monitoring: {
    snmpCommunity: 'public',
    snmpVersion: '2c',
    pollingInterval: 300,
    metricsInterval: 60,
    retentionDays: 30,
  },
  security: {
    sessionTimeout: 3600,
    passwordPolicy: 'strong',
    twoFactorEnabled: false,
    ipAllowlist: '',
  },
  alerting: {
    autoAcknowledgeMinutes: 0,
    dedupWindowMinutes: 10,
    escalationMinutes: 30,
    maintenanceWindow: 'Dom 00:00-04:00',
  },
  sla: {
    targetAvailability: 99.9,
    maxResponseMs: 150,
    outageThresholdMinutes: 5,
  },
  integrations: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
    grafanaUrl: import.meta.env.VITE_GRAFANA_URL || '',
    telegramChatId: '',
    webhookUrl: '',
    apiConnections: [],
  },
};

const toggleLabels = {
  true: 'Ativo',
  false: 'Inativo',
};

const Settings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const stored = window.localStorage.getItem('octoisp.preferences');
    return stored
      ? JSON.parse(stored)
      : {
          compact: false,
          reducedMotion: false,
          glow: true,
          highContrast: false,
          darkMode: window.localStorage.getItem('octoisp.theme') === 'dark',
          palette: window.localStorage.getItem('octoisp.themePalette') || 'sky',
        };
  });

  useEffect(() => {
    const stored = window.localStorage.getItem('octoisp.settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : defaultSettings))
      .then((data) => {
        setSettings(data);
        window.localStorage.setItem('octoisp.settings', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('octoisp-settings-updated'));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('octoisp.preferences', JSON.stringify(preferences));
    const body = document.body;
    const palettes = ['sky', 'aurora', 'circuit', 'solar', 'ocean'];
    body.classList.toggle('app-compact', preferences.compact);
    body.classList.toggle('app-reduced-motion', preferences.reducedMotion);
    body.classList.toggle('app-glow', preferences.glow);
    body.classList.toggle('app-high-contrast', preferences.highContrast);
    body.classList.toggle('theme-dark', preferences.darkMode);
    palettes.forEach((palette) => body.classList.remove(`theme-${palette}`));
    body.classList.add(`theme-${preferences.palette || 'sky'}`);
    window.localStorage.setItem('octoisp.theme', preferences.darkMode ? 'dark' : 'light');
    window.localStorage.setItem('octoisp.themePalette', preferences.palette || 'sky');
    window.dispatchEvent(
      new CustomEvent('octoisp-theme-change', { detail: { dark: preferences.darkMode } })
    );
  }, [preferences]);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [loading]);

  const updateSection = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateIntegrationField = (field, value) => {
    updateSection('integrations', field, value);
  };

  const updateApiConnection = (index, field, value) => {
    setSettings((prev) => {
      const list = [...(prev.integrations.apiConnections || [])];
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        integrations: { ...prev.integrations, apiConnections: list },
      };
    });
  };

  const addApiConnection = () => {
    setSettings((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        apiConnections: [
          ...(prev.integrations.apiConnections || []),
          { name: '', baseUrl: '', apiKey: '', webhookUrl: '', type: 'inventory', enabled: true },
        ],
      },
    }));
  };

  const removeApiConnection = (index) => {
    setSettings((prev) => {
      const list = [...(prev.integrations.apiConnections || [])];
      list.splice(index, 1);
      return {
        ...prev,
        integrations: { ...prev.integrations, apiConnections: list },
      };
    });
  };

  const [showSecrets, setShowSecrets] = useState({ anon: false, service: false, api: {} });

  const toggleApiKey = (index) => {
    setShowSecrets((prev) => ({
      ...prev,
      api: { ...prev.api, [index]: !prev.api[index] },
    }));
  };

  const testIntegration = async (label, url, method = 'GET') => {
    if (!url) {
      toast.error('Informe uma URL para testar.');
      return;
    }
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method, payload: { ping: 'octoisp' } }),
      });
      if (!response.ok) {
        throw new Error('Falha no teste');
      }
      const data = await response.json();
      if (data.ok) {
        toast.success(`${label} OK • ${data.latencyMs}ms`);
      } else {
        toast.error(`${label} retornou status ${data.status}`);
      }
    } catch (error) {
      toast.error(`Falha ao testar ${label}.`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        window.localStorage.setItem('octoisp.settings', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('octoisp-settings-updated'));
        toast.success('Configurações salvas.');
      } else {
        toast.error('Falha ao salvar configurações.');
      }
    } catch (error) {
      toast.error('Falha ao conectar na API.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/settings/test-notification', {
        method: 'POST',
      });
      if (!response.ok) {
        toast.error('Erro ao enviar notificação.');
        return;
      }
      const data = await response.json();
      toast.success(`${data.message} (${data.channels.join(', ')})`);
    } catch (error) {
      toast.error('Erro ao enviar notificação.');
    }
  };

  const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('settings.title', 'Configurações')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.description', 'Gerencie o ambiente, integrações e políticas de acesso.')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={GlobeAltIcon}
            title="Geral"
            description="Identidade e regionalização do ambiente."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nome do provedor</label>
              <input
                value={settings.general.companyName}
                onChange={(event) => updateSection('general', 'companyName', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fuso horário</label>
              <input
                value={settings.general.timezone}
                onChange={(event) => updateSection('general', 'timezone', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Idioma</label>
              <input
                value={settings.general.language}
                onChange={(event) => updateSection('general', 'language', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Formato de data</label>
              <input
                value={settings.general.dateFormat}
                onChange={(event) => updateSection('general', 'dateFormat', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Logomarca do sistema</label>
              <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-slate-200 p-4">
                {settings.general.logoUrl ? (
                  <img
                    src={settings.general.logoUrl}
                    alt="Logomarca atual"
                    className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                    Sem logo
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const maxSize = 1024 * 1024 * 2;
                        if (file.size > maxSize) {
                          toast.error('A imagem deve ter no máximo 2MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateSection('general', 'logoUrl', reader.result || '');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    Fazer upload
                  </label>
                  {settings.general.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateSection('general', 'logoUrl', '')}
                      className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Remover logo
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  PNG ou SVG recomendado. Máx: 2MB.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={BellAlertIcon}
            title="Notificações"
            description="Canais e regras de alerta."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { key: 'emailEnabled', label: 'E-mail' },
              { key: 'smsEnabled', label: 'SMS' },
              { key: 'pushEnabled', label: 'Push' },
              { key: 'telegramEnabled', label: 'Telegram' },
              { key: 'webhookEnabled', label: 'Webhook' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  updateSection(
                    'notifications',
                    item.key,
                    !settings.notifications[item.key]
                  )
                }
                className={`flex items-center justify-between rounded-md border px-4 py-2 text-sm font-medium ${
                  settings.notifications[item.key]
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-gray-200 text-gray-600 hover:border-sky-200'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs">{toggleLabels[settings.notifications[item.key]]}</span>
              </button>
            ))}
            <div>
              <label className="text-sm font-medium text-gray-700">Severidade mínima</label>
              <select
                value={settings.notifications.alertThreshold}
                onChange={(event) => updateSection('notifications', 'alertThreshold', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Janela de notificação</label>
              <input
                value={settings.notifications.notifyWindow}
                onChange={(event) => updateSection('notifications', 'notifyWindow', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            className="mt-4 inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Testar notificação
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={AdjustmentsHorizontalIcon}
            title="Monitoramento"
            description="Parâmetros de SNMP e retenção."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">SNMP Community</label>
              <input
                value={settings.monitoring.snmpCommunity}
                onChange={(event) => updateSection('monitoring', 'snmpCommunity', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SNMP Version</label>
              <select
                value={settings.monitoring.snmpVersion}
                onChange={(event) => updateSection('monitoring', 'snmpVersion', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option value="2c">2c</option>
                <option value="3">3</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Intervalo de polling (s)</label>
              <input
                type="number"
                value={settings.monitoring.pollingInterval}
                onChange={(event) =>
                  updateSection('monitoring', 'pollingInterval', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Intervalo métricas (s)</label>
              <input
                type="number"
                value={settings.monitoring.metricsInterval}
                onChange={(event) =>
                  updateSection('monitoring', 'metricsInterval', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Retenção (dias)</label>
              <input
                type="number"
                value={settings.monitoring.retentionDays}
                onChange={(event) =>
                  updateSection('monitoring', 'retentionDays', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={ShieldCheckIcon}
            title="Segurança"
            description="Sessões, autenticação e controle de acesso."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Tempo de sessão (s)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(event) =>
                  updateSection('security', 'sessionTimeout', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Política de senha</label>
              <select
                value={settings.security.passwordPolicy}
                onChange={(event) => updateSection('security', 'passwordPolicy', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option value="basic">Básica</option>
                <option value="strong">Forte</option>
                <option value="strict">Estrita</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">MFA</label>
              <button
                type="button"
                onClick={() =>
                  updateSection('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)
                }
                className={`mt-2 w-full rounded-md border px-3 py-2 text-sm font-medium ${
                  settings.security.twoFactorEnabled
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-gray-200 text-gray-600 hover:border-sky-200'
                }`}
              >
                {toggleLabels[settings.security.twoFactorEnabled]}
              </button>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">IP Allowlist</label>
              <input
                value={settings.security.ipAllowlist}
                onChange={(event) => updateSection('security', 'ipAllowlist', event.target.value)}
                placeholder="192.168.0.0/24, 10.0.0.0/16"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div id="alertas-config" className="scroll-mt-24 rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={BoltIcon}
            title="Alertas e Escalonamento"
            description="Regras de deduplicação e janela de manutenção."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto reconhecer (min)</label>
              <input
                type="number"
                value={settings.alerting.autoAcknowledgeMinutes}
                onChange={(event) =>
                  updateSection('alerting', 'autoAcknowledgeMinutes', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Deduplicação (min)</label>
              <input
                type="number"
                value={settings.alerting.dedupWindowMinutes}
                onChange={(event) =>
                  updateSection('alerting', 'dedupWindowMinutes', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Escalonar após (min)</label>
              <input
                type="number"
                value={settings.alerting.escalationMinutes}
                onChange={(event) =>
                  updateSection('alerting', 'escalationMinutes', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Janela de manutenção</label>
              <input
                value={settings.alerting.maintenanceWindow}
                onChange={(event) =>
                  updateSection('alerting', 'maintenanceWindow', event.target.value)
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <SectionHeader
            icon={ShieldCheckIcon}
            title="SLA"
            description="Parâmetros de qualidade e disponibilidade."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Disponibilidade (%)</label>
              <input
                type="number"
                value={settings.sla.targetAvailability}
                onChange={(event) =>
                  updateSection('sla', 'targetAvailability', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tempo resposta (ms)</label>
              <input
                type="number"
                value={settings.sla.maxResponseMs}
                onChange={(event) =>
                  updateSection('sla', 'maxResponseMs', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Threshold outage (min)</label>
              <input
                type="number"
                value={settings.sla.outageThresholdMinutes}
                onChange={(event) =>
                  updateSection('sla', 'outageThresholdMinutes', Number(event.target.value))
                }
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <SectionHeader
            icon={CloudArrowUpIcon}
            title="Integrações"
            description="Conexões externas e webhooks."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Supabase URL</label>
              <input
                value={settings.integrations.supabaseUrl}
                onChange={(event) => updateIntegrationField('supabaseUrl', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Supabase Anon Key</label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showSecrets.anon ? 'text' : 'password'}
                  value={settings.integrations.supabaseAnonKey}
                  onChange={(event) => updateIntegrationField('supabaseAnonKey', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets((prev) => ({ ...prev, anon: !prev.anon }))}
                  className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {showSecrets.anon ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Service Role Key</label>
              <div className="mt-2 flex gap-2">
                <input
                  type={showSecrets.service ? 'text' : 'password'}
                  value={settings.integrations.supabaseServiceRoleKey}
                  onChange={(event) =>
                    updateIntegrationField('supabaseServiceRoleKey', event.target.value)
                  }
                  className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-amber-400"
                  placeholder="Use apenas se necessário"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets((prev) => ({ ...prev, service: !prev.service }))}
                  className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {showSecrets.service ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="mt-1 text-xs text-amber-600">
                Chave sensível. Evite expor em ambientes não seguros.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Grafana URL</label>
              <input
                value={settings.integrations.grafanaUrl}
                onChange={(event) => updateIntegrationField('grafanaUrl', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telegram Chat ID</label>
              <input
                value={settings.integrations.telegramChatId}
                onChange={(event) => updateIntegrationField('telegramChatId', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Webhook URL</label>
              <input
                value={settings.integrations.webhookUrl}
                onChange={(event) => updateIntegrationField('webhookUrl', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => testIntegration('Supabase', settings.integrations.supabaseUrl)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Testar Supabase
            </button>
            <button
              type="button"
              onClick={() => testIntegration('Grafana', settings.integrations.grafanaUrl)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Testar Grafana
            </button>
            <button
              type="button"
              onClick={() => testIntegration('Webhook', settings.integrations.webhookUrl, 'POST')}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Testar Webhook
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <KeyIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Preferências de Interface</h2>
            <p className="text-sm text-gray-500">Ajustes visuais para a operação diária.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            {
              key: 'darkMode',
              label: 'Tema escuro',
              description: 'Interface com contraste suave para salas de NOC.',
            },
            {
              key: 'compact',
              label: 'Modo compacto',
              description: 'Reduz espaçamentos para exibir mais informação.',
            },
            {
              key: 'reducedMotion',
              label: 'Reduzir animações',
              description: 'Desativa transições para foco e acessibilidade.',
            },
            {
              key: 'glow',
              label: 'Realce luminoso',
              description: 'Destaca cards e painéis com brilho suave.',
            },
            {
              key: 'highContrast',
              label: 'Alto contraste',
              description: 'Textos mais fortes para leitura em campo.',
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                setPreferences((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                preferences[item.key]
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/50'
              }`}
            >
              <span
                className={`mt-1 h-4 w-4 rounded-full border ${
                  preferences[item.key] ? 'bg-sky-600 border-sky-600' : 'border-gray-300'
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Paleta de tema</h3>
          <p className="text-xs text-gray-500">Escolha o estilo visual da operação.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              {
                id: 'sky',
                name: 'Skyline',
                desc: 'Azul limpo com brilho suave.',
                gradient: 'from-sky-400 via-indigo-400 to-emerald-400',
              },
              {
                id: 'aurora',
                name: 'Aurora',
                desc: 'Verdes e violetas vibrantes.',
                gradient: 'from-emerald-400 via-sky-400 to-indigo-500',
              },
              {
                id: 'circuit',
                name: 'Circuit',
                desc: 'Tech neon e alto contraste.',
                gradient: 'from-emerald-400 via-cyan-400 to-slate-900',
              },
              {
                id: 'solar',
                name: 'Solar',
                desc: 'Âmbar e coral energéticos.',
                gradient: 'from-amber-400 via-orange-500 to-rose-500',
              },
              {
                id: 'ocean',
                name: 'Ocean',
                desc: 'Azul profundo com teal.',
                gradient: 'from-blue-500 via-cyan-400 to-teal-400',
              },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPreferences((prev) => ({ ...prev, palette: option.id }))}
                className={`rounded-xl border p-4 text-left transition ${
                  preferences.palette === option.id
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/50'
                }`}
              >
                <div
                  className={`h-10 w-full rounded-lg bg-gradient-to-r ${option.gradient}`}
                />
                <p className="mt-3 text-sm font-semibold text-gray-900">{option.name}</p>
                <p className="text-xs text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setPreferences({
                compact: false,
                reducedMotion: false,
                glow: true,
                highContrast: false,
                darkMode: false,
                palette: 'sky',
              })
            }
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={() => toast.success('Preferências salvas.')}
            className="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Salvar preferências
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Integrações de APIs do POP</h2>
            <p className="text-sm text-gray-500">
              Vincule APIs externas por POP para inventário, eventos e métricas.
            </p>
          </div>
          <button
            type="button"
            onClick={addApiConnection}
            className="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Adicionar integração
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {(settings.integrations.apiConnections || []).length === 0 && (
            <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              Nenhuma integração cadastrada.
            </div>
          )}
          {(settings.integrations.apiConnections || []).map((item, index) => (
            <div key={`${item.name}-${index}`} className="rounded-lg border border-gray-200 p-4">
              <div className="grid gap-4 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Nome
                  </label>
                  <input
                    value={item.name}
                    onChange={(event) => updateApiConnection(index, 'name', event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Base URL
                  </label>
                  <input
                    value={item.baseUrl}
                    onChange={(event) => updateApiConnection(index, 'baseUrl', event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Tipo
                  </label>
                  <select
                    value={item.type}
                    onChange={(event) => updateApiConnection(index, 'type', event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="inventory">Inventário</option>
                    <option value="events">Eventos</option>
                    <option value="metrics">Métricas</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => updateApiConnection(index, 'enabled', !item.enabled)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.enabled ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    API Key
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type={showSecrets.api[index] ? 'text' : 'password'}
                      value={item.apiKey}
                      onChange={(event) => updateApiConnection(index, 'apiKey', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKey(index)}
                      className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      {showSecrets.api[index] ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Webhook URL
                  </label>
                  <input
                    value={item.webhookUrl}
                    onChange={(event) =>
                      updateApiConnection(index, 'webhookUrl', event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="lg:col-span-2 flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => testIntegration(item.name || 'API', item.baseUrl)}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    Testar API
                  </button>
                  <button
                    type="button"
                    onClick={() => testIntegration(item.name || 'Webhook', item.webhookUrl, 'POST')}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    Testar Webhook
                  </button>
                  <button
                    type="button"
                    onClick={() => removeApiConnection(index)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
