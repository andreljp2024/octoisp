import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import {
  ArrowTrendingUpIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { apiGet } from '../lib/api';
import toast from 'react-hot-toast';

const rangeOptions = [
  { value: '1h', label: '1h', hint: 'Última hora' },
  { value: '6h', label: '6h', hint: 'Últimas 6h' },
  { value: '24h', label: '24h', hint: 'Últimas 24h' },
  { value: '7d', label: '7d', hint: 'Últimos 7 dias' },
  { value: '30d', label: '30d', hint: 'Últimos 30 dias' },
];

const refreshOptions = [
  { value: 0, label: 'Desativado' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
];

const toneStyles = {
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  indigo: { bg: 'bg-sky-100', text: 'text-sky-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  red: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

const buildStats = (summary) => [
  {
    label: 'Disponibilidade',
    value:
      summary?.availability !== undefined && summary?.availability !== null
        ? `${summary.availability.toFixed(2)}%`
        : '—',
    icon: SignalIcon,
    hint: 'Disponibilidade geral',
    tone: 'green',
  },
  {
    label: 'Latência média',
    value:
      summary?.avgLatencyMs !== undefined && summary?.avgLatencyMs !== null
        ? `${summary.avgLatencyMs} ms`
        : '—',
    icon: ArrowTrendingUpIcon,
    hint: 'Core / acesso',
    tone: 'indigo',
  },
  {
    label: 'Perda de pacotes',
    value:
      summary?.packetLoss !== undefined && summary?.packetLoss !== null
        ? `${summary.packetLoss}%`
        : '—',
    icon: ExclamationTriangleIcon,
    hint: 'Janela selecionada',
    tone: 'amber',
  },
  {
    label: 'Links críticos',
    value: summary?.criticalLinks ?? '—',
    icon: ArrowDownTrayIcon,
    hint: 'Alertas críticos',
    tone: 'red',
  },
];

function StatusPill({ status }) {
  const styles =
    status === 'online'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'degraded'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';

  const label = status === 'online' ? 'Online' : status === 'degraded' ? 'Degradado' : 'Offline';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function NetworkMonitoring() {
  const [range, setRange] = useState('24h');
  const [refreshMs, setRefreshMs] = useState(30000);
  const [providerId, setProviderId] = useState('');

  const { data: meData } = useQuery('userContext', () => apiGet('/api/users/me'));
  const isGlobalAdmin = meData?.role === 'admin_global';
  const canExport = (meData?.permissions || []).includes('reports.generate');

  const { data: providersData } = useQuery(
    'providersList',
    () => apiGet('/api/providers?scope=all'),
    { enabled: isGlobalAdmin }
  );

  const providers = providersData?.providers || [];

  useEffect(() => {
    if (isGlobalAdmin && !providerId && providers.length) {
      setProviderId(providers[0].id);
    }
  }, [isGlobalAdmin, providerId, providers]);

  const providerParam = isGlobalAdmin && providerId ? `&providerId=${providerId}` : '';
  const rangeParam = range ? `&range=${range}` : '';
  const refetchInterval = refreshMs > 0 ? refreshMs : false;

  const summaryQuery = useQuery(
    ['networkSummary', range, providerId],
    () => apiGet(`/api/network/summary?${rangeParam}${providerParam}`.replace('?&', '?')),
    { enabled: !isGlobalAdmin || !!providerId, refetchInterval }
  );

  const latencyQuery = useQuery(
    ['networkLatency', range, providerId],
    () => apiGet(`/api/network/latency?${rangeParam}${providerParam}`.replace('?&', '?')),
    { enabled: !isGlobalAdmin || !!providerId, refetchInterval }
  );

  const popsQuery = useQuery(
    ['networkPops', providerId],
    () =>
      apiGet(isGlobalAdmin && providerId ? `/api/pops?providerId=${providerId}` : '/api/pops'),
    { enabled: !isGlobalAdmin || !!providerId, refetchInterval }
  );

  const alertsQuery = useQuery(
    ['networkAlerts', providerId],
    () =>
      apiGet(isGlobalAdmin && providerId ? `/api/alerts?providerId=${providerId}` : '/api/alerts'),
    { enabled: !isGlobalAdmin || !!providerId, refetchInterval }
  );

  const pops = useMemo(() => {
    return (popsQuery.data?.pops || []).map((pop) => ({
      id: pop.id,
      name: pop.name,
      city: pop.location || pop.city,
      status: pop.status,
      links: Math.max(1, Math.round((pop.devices || 1) / 10)),
      utilization: pop.utilization ? `${pop.utilization}%` : '—',
      provider: pop.providerName,
    }));
  }, [popsQuery.data]);

  const incidents = useMemo(() => {
    return (alertsQuery.data?.alerts || [])
      .filter((alert) => alert.severity === 'critical' || alert.severity === 'warning')
      .slice(0, 4)
      .map((alert) => ({
        id: alert.id,
        title: alert.title,
        scope: alert.deviceName || alert.deviceId || 'Rede',
        time: alert.timestamp,
        severity: alert.severity,
      }));
  }, [alertsQuery.data]);

  const latencyData =
    latencyQuery.data?.series?.map((item) => ({
      time: item.time,
      core: item.core,
      backbone: item.backbone,
    })) || [];

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '—';
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return timestamp;
    const diffMs = Date.now() - parsed.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'network',
          format: 'CSV',
          providerId: providerId || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error('Falha ao exportar.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'octoisp-network.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório exportado.');
    } catch (error) {
      toast.error('Falha ao exportar relatório.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Monitoramento de Rede</h1>
          <p className="mt-1 text-sm text-gray-500">
            Painel em tempo real com saúde do backbone, POPs e incidentes críticos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isGlobalAdmin && (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 text-sky-600" />
              <select
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              >
                <option value="">Selecione o provedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <ClockIcon className="h-4 w-4 text-sky-600" />
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} • {option.hint}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <ArrowPathIcon className="h-4 w-4 text-sky-600" />
            <select
              value={refreshMs}
              onChange={(event) => setRefreshMs(Number(event.target.value))}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
            >
              {refreshOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Auto refresh: {option.label}
                </option>
              ))}
            </select>
          </div>
          {canExport && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Exportar relatório
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {buildStats(summaryQuery.data).map((item) => {
          const tone = toneStyles[item.tone];
          const Icon = item.icon;
          return (
            <div key={item.label} className="card animate-rise p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone.bg} ${tone.text}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400">{item.hint}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 chart-surface animate-rise">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Latência média (ms)</h2>
              <p className="text-sm text-gray-500">Core vs acesso</p>
            </div>
            <span className="text-xs text-gray-400">Janela: {range}</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) => {
                    const parsed = new Date(value);
                    if (Number.isNaN(parsed.getTime())) return value;
                    return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="core" stroke="#0ea5e9" strokeWidth={2} name="Core" isAnimationActive animationDuration={900} />
                <Line type="monotone" dataKey="backbone" stroke="#10b981" strokeWidth={2} name="Acesso" isAnimationActive animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel animate-rise">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Incidentes críticos</h2>
            <span className="text-xs text-gray-400">Auto refresh</span>
          </div>
          <ul className="mt-4 space-y-4">
            {incidents.map((incident) => (
              <li key={incident.id} className="rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{incident.title}</p>
                  <span
                    className={`text-xs font-semibold ${
                      incident.severity === 'critical'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {incident.severity === 'critical' ? 'Crítico' : 'Alerta'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{incident.scope}</p>
                <p className="mt-2 text-xs text-gray-400">{formatRelativeTime(incident.time)}</p>
              </li>
            ))}
            {!incidents.length && (
              <li className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                Nenhum incidente crítico no momento.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="panel animate-rise p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Status dos POPs</h2>
          <p className="mt-1 text-sm text-gray-500">Resumo operacional e utilização de links.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  POP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cidade
                </th>
                {isGlobalAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Provedor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Utilização
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pops.map((pop) => (
                <tr key={pop.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{pop.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.city}</td>
                  {isGlobalAdmin && (
                    <td className="px-6 py-4 text-sm text-gray-500">{pop.provider || '—'}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <StatusPill status={pop.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.links}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.utilization}</td>
                </tr>
              ))}
              {!pops.length && (
                <tr>
                  <td colSpan={isGlobalAdmin ? 6 : 5} className="px-6 py-6 text-center text-sm text-gray-500">
                    Nenhum POP disponível para este provedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chart-surface animate-rise">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Qualidade do backbone</h2>
          <span className="text-xs text-gray-400">Tendência por janela</span>
        </div>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="coreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => {
                  const parsed = new Date(value);
                  if (Number.isNaN(parsed.getTime())) return value;
                  return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }}
              />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="core"
                stroke="#0ea5e9"
                fill="url(#coreGradient)"
                name="Core"
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default NetworkMonitoring;
