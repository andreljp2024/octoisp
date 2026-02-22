import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import {
  ArrowTrendingUpIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SignalIcon,
  ServerStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiGet } from '../lib/api';

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const fetchDashboardStats = () => apiGet('/api/reports/dashboard');
const fetchAlerts = () => apiGet('/api/alerts');
const fetchTraffic = () => apiGet('/api/reports/traffic');
const fetchDevices = () => apiGet('/api/devices');

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '—';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d atrás`;
};

function Dashboard() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('octoisp.dashboard.expanded') === '1';
  });
  const { data: statsData } = useQuery('dashboardStats', fetchDashboardStats, {
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
  const { data: alertsData } = useQuery('recentAlerts', fetchAlerts);
  const { data: trafficData } = useQuery('trafficData', fetchTraffic);
  const { data: devicesData } = useQuery('devicesData', fetchDevices);
  const deviceStatusData = useMemo(() => {
    const devices = devicesData?.devices || [];
    const online = devices.filter((d) => d.status === 'online').length;
    const offline = devices.filter((d) => d.status === 'offline').length;
    const degraded = devices.filter((d) => d.status === 'degraded').length;
    return [
      { name: 'Online', value: online },
      { name: 'Offline', value: offline },
      { name: 'Degradado', value: degraded }
    ];
  }, [devicesData]);

  const colorClasses = {
    indigo: { bg: 'bg-sky-100', text: 'text-sky-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  useEffect(() => {
    const body = document.body;
    const container = document.querySelector('.app-shell main > div');
    if (expanded) {
      body.classList.add('dashboard-expanded');
      if (container) {
        container.style.maxWidth = '100%';
        container.style.paddingLeft = '1.5rem';
        container.style.paddingRight = '1.5rem';
      }
    } else {
      body.classList.remove('dashboard-expanded');
      if (container) {
        container.style.maxWidth = '';
        container.style.paddingLeft = '';
        container.style.paddingRight = '';
      }
    }
    window.localStorage.setItem('octoisp.dashboard.expanded', expanded ? '1' : '0');
    return () => {
      body.classList.remove('dashboard-expanded');
      if (container) {
        container.style.maxWidth = '';
        container.style.paddingLeft = '';
        container.style.paddingRight = '';
      }
    };
  }, [expanded]);

  const StatCard = ({ title, value, icon: Icon, change, color = 'blue', expandedMode }) => {
    const tone = colorClasses[color] || colorClasses.blue;
    return (
    <div className="card animate-rise overflow-hidden">
      <div className={expandedMode ? 'p-6' : 'p-5'}>
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${expandedMode ? 'p-3.5' : 'p-3'} ${tone.bg} ${tone.text}`}>
            <Icon className={expandedMode ? 'h-7 w-7' : 'h-6 w-6'} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className={expandedMode ? 'text-3xl font-semibold text-gray-900' : 'text-2xl font-semibold text-gray-900'}>
                  {value}
                </div>
                {change && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <ArrowTrendingUpIcon className="-ml-1 mr-0.5 flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span>{change}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className={expanded ? 'dashboard-expanded' : ''}>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard NOC</h1>
          <p className="mt-1 text-sm text-gray-500">Visão geral da rede em tempo real</p>
        </div>
        <div className="mt-4 flex sm:mt-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            {expanded ? (
              <ArrowsPointingInIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            ) : (
              <ArrowsPointingOutIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            )}
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Modo expandido ativo: mais espaço para gráficos e indicadores.
        </div>
      )}

      {/* Grade de Estatísticas */}
      <div className={`grid grid-cols-1 ${expanded ? 'gap-6' : 'gap-5'} sm:grid-cols-2 lg:grid-cols-4 mb-8`}>
        <StatCard
          title="Dispositivos Totais"
          value={statsData?.totalDevices?.toLocaleString() || '...'}
          icon={ServerStackIcon}
          color="indigo"
          expandedMode={expanded}
        />
        <StatCard
          title="Dispositivos Online"
          value={statsData?.onlineDevices?.toLocaleString() || '...'}
          icon={SignalIcon}
          change={statsData?.uptime ? `${statsData.uptime}%` : undefined}
          color="green"
          expandedMode={expanded}
        />
        <StatCard
          title="Clientes Ativos"
          value={statsData?.totalCustomers?.toLocaleString() || '...'}
          icon={CheckCircleIcon}
          color="blue"
          expandedMode={expanded}
        />
        <StatCard
          title="Alertas Ativos"
          value={statsData?.activeAlerts || '...'}
          icon={ExclamationTriangleIcon}
          color="red"
          expandedMode={expanded}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Tráfego */}
        <div className="lg:col-span-2 chart-surface animate-rise">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tráfego Semanal (Mbps)</h2>
          <div className={expanded ? 'h-96' : 'h-80'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('pt-BR', { weekday: 'short' })
                  }
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="downloadMbps" fill="#3B82F6" name="Download (Mbps)" isAnimationActive animationDuration={900} />
                <Bar dataKey="uploadMbps" fill="#10B981" name="Upload (Mbps)" isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status dos Dispositivos */}
        <div className="chart-surface animate-rise">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Status dos Dispositivos</h2>
          <div className={expanded ? 'h-96' : 'h-80'}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={expanded ? 110 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive
                  animationDuration={900}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Dispositivos']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas Recentes */}
      <div className="panel animate-rise overflow-hidden p-0 sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Alertas Recentes</h3>
          <p className="mt-1 text-sm text-gray-500">Últimos eventos críticos e avisos</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {alertsData?.alerts?.slice(0, 6).map((alert) => (
            <li key={alert.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-sky-600 truncate">{alert.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                        alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {alert.severity === 'critical' ? 'Crítico' : 
                       alert.severity === 'warning' ? 'Aviso' : 'Info'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {alert.deviceName || alert.deviceId}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>{formatRelativeTime(alert.timestamp)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
