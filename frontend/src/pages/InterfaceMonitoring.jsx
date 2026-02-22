import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  CpuChipIcon,
  WifiIcon,
  ArrowPathIcon,
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

const InterfaceMonitoring = () => {
  const [providerId, setProviderId] = useState('');
  const [popId, setPopId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [iface, setIface] = useState('');

  const { data: meData } = useQuery('userContext', () => apiGet('/api/users/me'));
  const isGlobalAdmin = meData?.role === 'admin_global';

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

  const { data: popsData } = useQuery(
    ['popsList', providerId],
    () => apiGet(isGlobalAdmin && providerId ? `/api/pops?providerId=${providerId}` : '/api/pops'),
    { enabled: !isGlobalAdmin || !!providerId }
  );
  const pops = popsData?.pops || [];

  useEffect(() => {
    if (!popId && pops.length) {
      setPopId(pops[0].id);
    }
  }, [popId, pops]);

  const { data: devicesData } = useQuery(
    ['devicesByPop', popId, providerId],
    () => {
      const params = new URLSearchParams();
      if (popId) params.append('popId', popId);
      if (isGlobalAdmin && providerId) params.append('providerId', providerId);
      return apiGet(`/api/devices?${params.toString()}`);
    },
    { enabled: !!popId }
  );
  const devices = devicesData?.devices || [];

  useEffect(() => {
    if (!deviceId && devices.length) {
      setDeviceId(devices[0].id);
    }
  }, [deviceId, devices]);

  const { data: interfacesData } = useQuery(
    ['deviceInterfaces', deviceId],
    () => apiGet(`/api/devices/${deviceId}/interfaces`),
    { enabled: !!deviceId }
  );

  const interfaces = interfacesData?.interfaces || [];

  useEffect(() => {
    if (!iface && interfaces.length) {
      setIface(interfaces[0].name);
    }
  }, [iface, interfaces]);

  const { data: metricsData, refetch } = useQuery(
    ['interfaceMetrics', deviceId, iface],
    () => apiGet(`/api/devices/${deviceId}/interfaces/${encodeURIComponent(iface)}/metrics`),
    { enabled: !!deviceId && !!iface, refetchInterval: 15000 }
  );

  const series = metricsData?.series || [];

  const selectedInterface = useMemo(
    () => interfaces.find((item) => item.name === iface),
    [interfaces, iface]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Monitoramento de Interfaces</h1>
          <p className="mt-1 text-sm text-gray-500">
            Selecione provedor, POP e equipamento para visualizar tráfego por interface.
          </p>
        </div>
        <Link
          to="/devices"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ver dispositivos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {isGlobalAdmin && (
          <div className="panel-sm animate-rise">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Provedor
            </label>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <BuildingOfficeIcon className="h-4 w-4 text-sky-600" />
              <select
                value={providerId}
                onChange={(event) => {
                  setProviderId(event.target.value);
                  setPopId('');
                  setDeviceId('');
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option value="">Selecione um provedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="panel-sm animate-rise">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">POP</label>
          <select
            value={popId}
            onChange={(event) => {
              setPopId(event.target.value);
              setDeviceId('');
            }}
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="">Selecione um POP</option>
            {pops.map((pop) => (
              <option key={pop.id} value={pop.id}>
                {pop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-sm animate-rise">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Equipamento
          </label>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <CpuChipIcon className="h-4 w-4 text-sky-600" />
            <select
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            >
              <option value="">Selecione um equipamento</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} • {device.ipAddress || 'Sem IP'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel-sm animate-rise">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Interface
          </label>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <WifiIcon className="h-4 w-4 text-sky-600" />
            <select
              value={iface}
              onChange={(event) => setIface(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            >
              <option value="">Selecione uma interface</option>
              {interfaces.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} • {item.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedInterface && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="panel animate-rise">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedInterface.name}</h2>
                <p className="text-sm text-gray-500">{selectedInterface.description}</p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Atualizar
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>Status: <span className="font-semibold text-gray-900">{selectedInterface.status}</span></p>
              <p>Velocidade: <span className="font-semibold text-gray-900">{selectedInterface.speedMbps} Mbps</span></p>
              <p>Utilização: <span className="font-semibold text-gray-900">{selectedInterface.utilizationPercent}%</span></p>
              <p>Erros: <span className="font-semibold text-gray-900">{selectedInterface.errors}</span></p>
            </div>
          </div>

          <div className="xl:col-span-2 chart-surface animate-rise">
            <h2 className="text-lg font-semibold text-gray-900">Tráfego (Mbps)</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="rxMbps" stroke="#0ea5e9" fill="url(#rxGradient)" name="Download" isAnimationActive animationDuration={900} />
                  <Area type="monotone" dataKey="txMbps" stroke="#22c55e" fill="url(#txGradient)" name="Upload" isAnimationActive animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedInterface && (
        <div className="chart-surface animate-rise">
          <h2 className="text-lg font-semibold text-gray-900">Utilização e erros</h2>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  }
                />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="utilization" stroke="#f59e0b" strokeWidth={2} name="Utilização (%)" isAnimationActive animationDuration={900} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Erros" isAnimationActive animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterfaceMonitoring;
