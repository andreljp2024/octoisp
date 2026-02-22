import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChartBarIcon,
  SignalIcon,
  WifiIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiGet } from '../lib/api';

const statusPill = {
  online: 'bg-green-100 text-green-700',
  degraded: 'bg-amber-100 text-amber-700',
  offline: 'bg-red-100 text-red-700',
};

const statusLabel = {
  online: 'Ativo',
  degraded: 'Degradado',
  offline: 'Offline',
};

const PopMonitoring = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPopId, setSelectedPopId] = useState(searchParams.get('popId') || '');
  const [selectedProviderId, setSelectedProviderId] = useState(
    searchParams.get('providerId') || ''
  );
  const [search, setSearch] = useState('');

  const { data: meData } = useQuery('userContext', () => apiGet('/api/users/me'));
  const isGlobalAdmin = meData?.role === 'admin_global';

  const { data: providersData, isLoading: loadingProviders } = useQuery(
    'providersList',
    () => apiGet('/api/providers?scope=all'),
    { enabled: isGlobalAdmin }
  );

  const providers = providersData?.providers || [];

  const { data: popsData, isLoading: loadingPops } = useQuery(
    ['popsList', selectedProviderId, isGlobalAdmin],
    () =>
      apiGet(
        isGlobalAdmin && selectedProviderId
          ? `/api/pops?providerId=${selectedProviderId}`
          : '/api/pops'
      ),
    { enabled: !isGlobalAdmin || !!selectedProviderId }
  );

  const pops = popsData?.pops || [];

  const setUrlParams = (providerId, popId) => {
    const params = {};
    if (providerId) params.providerId = providerId;
    if (popId) params.popId = popId;
    setSearchParams(params);
  };

  useEffect(() => {
    if (isGlobalAdmin && !selectedProviderId && providers.length) {
      setSelectedProviderId(providers[0].id);
      setUrlParams(providers[0].id, selectedPopId);
    }
  }, [isGlobalAdmin, providers, selectedProviderId]);

  useEffect(() => {
    if (!selectedPopId && pops.length) {
      setSelectedPopId(pops[0].id);
      setUrlParams(selectedProviderId, pops[0].id);
      return;
    }

    if (selectedPopId && pops.length) {
      const exists = pops.some((pop) => pop.id === selectedPopId);
      if (!exists) {
        setSelectedPopId(pops[0].id);
        setUrlParams(selectedProviderId, pops[0].id);
      }
    }
  }, [selectedPopId, pops, selectedProviderId]);

  const monitoringQuery = useQuery(
    ['popMonitoring', selectedPopId],
    () => apiGet(`/api/pops/${selectedPopId}/monitoring`),
    {
      enabled: !!selectedPopId,
      refetchInterval: 15000,
    }
  );

  const filteredPops = useMemo(() => {
    if (!search) return pops;
    const query = search.toLowerCase();
    return pops.filter((pop) => {
      const name = `${pop.name || ''} ${pop.location || ''} ${pop.city || ''}`;
      return name.toLowerCase().includes(query);
    });
  }, [pops, search]);

  const handleSelect = (event) => {
    const value = event.target.value;
    setSelectedPopId(value);
    setUrlParams(selectedProviderId, value);
  };

  const handleProviderSelect = (event) => {
    const value = event.target.value;
    setSelectedProviderId(value);
    setSelectedPopId('');
    setUrlParams(value, '');
  };

  const monitoring = monitoringQuery.data;
  const trafficSeries = monitoring?.traffic?.series || [];

  const summaryCards = [
    {
      label: 'Download',
      value: `${monitoring?.traffic?.current?.downloadMbps?.toFixed?.(2) || 0} Mbps`,
      icon: ChartBarIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Upload',
      value: `${monitoring?.traffic?.current?.uploadMbps?.toFixed?.(2) || 0} Mbps`,
      icon: WifiIcon,
      tone: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Latência',
      value: `${monitoring?.traffic?.current?.latencyMs || 0} ms`,
      icon: SignalIcon,
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Perda',
      value: `${monitoring?.traffic?.current?.packetLoss || 0}%`,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-100 text-amber-700',
    },
  ];

  const topDevices = monitoring?.topDevices || [];
  const alerts = monitoring?.alerts || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('popMonitoring.title', 'Monitoramento de POP')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t(
              'popMonitoring.description',
              'Acompanhe em tempo real a interface do POP com tráfego, latência e status.'
            )}
          </p>
        </div>
        <Link
          to="/pops"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Voltar aos POPs
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="panel-sm animate-rise">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Selecionar POP
          </p>
          {isGlobalAdmin && (
            <div className="mt-3">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Provedor
              </label>
              <select
                value={selectedProviderId}
                onChange={handleProviderSelect}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option value="">
                  {loadingProviders ? 'Carregando provedores...' : 'Selecione um provedor'}
                </option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar POP..."
            className="mt-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          />
          <select
            value={selectedPopId}
            onChange={handleSelect}
            className="mt-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="">
              {loadingPops ? 'Carregando POPs...' : 'Selecione um POP'}
            </option>
            {filteredPops.map((pop) => (
              <option key={pop.id} value={pop.id}>
                {pop.name} • {pop.location || pop.city || 'Sem cidade'}
              </option>
            ))}
          </select>

          {monitoring?.pop && (
            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{monitoring.pop.name}</p>
              <p className="text-xs text-gray-500">{monitoring.pop.city || '—'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${
                    statusPill[monitoring.pop.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {statusLabel[monitoring.pop.status] || monitoring.pop.status}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">
                  Uplink: {monitoring.pop.uplinkCapacity || '—'}
                </span>
                {monitoring.pop.providerName && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-gray-600">
                    Provedor: {monitoring.pop.providerName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="card animate-rise p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.tone}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chart-surface animate-rise">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tráfego agregado</h2>
                <p className="text-sm text-gray-500">Download e upload por janela de 5 min.</p>
              </div>
              <button
                type="button"
                onClick={() => monitoringQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Atualizar
              </button>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficSeries}>
                  <defs>
                    <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="downloadMbps"
                    stroke="#0ea5e9"
                    fill="url(#downGradient)"
                    name="Download (Mbps)"
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="uploadMbps"
                    stroke="#6366f1"
                    fill="url(#upGradient)"
                    name="Upload (Mbps)"
                    isAnimationActive
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-surface animate-rise">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Latência & perda</h2>
                <p className="text-sm text-gray-500">Indicadores de qualidade por janela.</p>
              </div>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    }
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="latencyMs"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Latência (ms)"
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Line
                    type="monotone"
                    dataKey="packetLoss"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Perda (%)"
                    isAnimationActive
                    animationDuration={900}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel animate-rise">
            <h2 className="text-lg font-semibold text-gray-900">Status operacional</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Dispositivos</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {monitoring?.devices?.total || 0}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Online: {monitoring?.devices?.online || 0} • Offline:{' '}
                  {monitoring?.devices?.offline || 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Atualização</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {monitoring?.updatedAt
                    ? new Date(monitoring.updatedAt).toLocaleString('pt-BR')
                    : '—'}
                </p>
                <p className="mt-2 text-xs text-gray-500">Auto-refresh a cada 15s</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Estado</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {statusLabel[monitoring?.pop?.status] || '—'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Uplink {monitoring?.pop?.uplinkCapacity || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="panel animate-rise">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top 10 dispositivos por consumo</h2>
                <p className="text-sm text-gray-500">Tráfego agregado na última hora.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Dispositivo</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Download</th>
                    <th className="px-4 py-2 text-right">Upload</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {topDevices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                        Sem dados de tráfego disponíveis.
                      </td>
                    </tr>
                  )}
                  {topDevices.map((device) => (
                    <tr key={device.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{device.name}</td>
                      <td className="px-4 py-3 text-gray-500">{device.customerName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{device.status}</td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {Number(device.downloadMbps || 0).toFixed(2)} Mbps
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {Number(device.uploadMbps || 0).toFixed(2)} Mbps
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {Number(device.totalMbps || 0).toFixed(2)} Mbps
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel animate-rise">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alertas ativos do POP</h2>
                <p className="text-sm text-gray-500">Incidentes abertos ou reconhecidos.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {alerts.length === 0 && (
                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
                  Nenhum alerta ativo neste POP.
                </div>
              )}
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-500">
                        {alert.deviceName || 'Sem dispositivo'} • {alert.customerName || 'Sem cliente'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : alert.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {alert.severity === 'critical'
                        ? 'Crítico'
                        : alert.severity === 'warning'
                        ? 'Aviso'
                        : 'Info'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleString('pt-BR')} • {alert.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopMonitoring;
