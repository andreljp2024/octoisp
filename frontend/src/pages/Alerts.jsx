import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExclamationTriangleIcon,
  BellAlertIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost } from '../lib/api';

const alertsData = [
  {
    id: 'alert-001',
    title: 'Alta utilização de CPU',
    device: 'Core Router 01',
    severity: 'critical',
    status: 'open',
    time: '2 min atrás',
    description: 'CPU acima de 90% por 5 minutos.',
  },
  {
    id: 'alert-002',
    title: 'Interface inativa',
    device: 'CPE Cliente 001',
    severity: 'critical',
    status: 'acknowledged',
    time: '12 min atrás',
    description: 'Porta LAN2 sem link detectado.',
  },
  {
    id: 'alert-003',
    title: 'Latência elevada',
    device: 'POP Sul',
    severity: 'warning',
    status: 'open',
    time: '22 min atrás',
    description: 'Latência média acima de 30ms.',
  },
  {
    id: 'alert-004',
    title: 'Queda de link',
    device: 'Backbone Norte',
    severity: 'critical',
    status: 'resolved',
    time: '1h atrás',
    description: 'Link restaurado após 8 minutos.',
  },
  {
    id: 'alert-005',
    title: 'Oscilação de sinal',
    device: 'OLT Matriz',
    severity: 'warning',
    status: 'acknowledged',
    time: '2h atrás',
    description: 'Nível óptico variando fora do padrão.',
  },
  {
    id: 'alert-006',
    title: 'Perda de pacotes',
    device: 'POP Centro',
    severity: 'info',
    status: 'open',
    time: '3h atrás',
    description: 'Perda de pacotes de 0.4% detectada.',
  },
];

const statusStyles = {
  open: 'bg-red-100 text-red-800',
  acknowledged: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
};

const statusLabels = {
  open: 'Aberto',
  acknowledged: 'Reconhecido',
  resolved: 'Resolvido',
};

const severityStyles = {
  critical: 'bg-red-50 text-red-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
};

const Alerts = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openView = (alert) => {
    setSelected(alert);
    setModalOpen(true);
  };

  const updateStatus = async (id, status) => {
    try {
      if (status === 'acknowledged') {
        await apiPost(`/api/alerts/${id}/acknowledge`, {});
      }
      if (status === 'resolved') {
        await apiPost(`/api/alerts/${id}/resolve`, {});
      }
      setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, status } : alert)));
      toast.success(`Alerta ${statusLabels[status].toLowerCase()}.`);
    } catch (error) {
      toast.error('Falha ao atualizar alerta.');
    }
  };

  const handleDelete = async (alert) => {
    if (!window.confirm(`Excluir alerta "${alert.title}"?`)) return;
    try {
      await apiDelete(`/api/alerts/${alert.id}`);
      setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      toast.success('Alerta excluído.');
    } catch (error) {
      toast.error('Falha ao excluir alerta.');
    }
  };

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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/alerts');
        const mapped = (data.alerts || alertsData).map((alert) => ({
          ...alert,
          device: alert.deviceName || alert.deviceId,
          time: formatRelativeTime(alert.timestamp)
        }));
        setAlerts(mapped);
      } catch (error) {
        toast.error('Falha ao carregar alertas.');
        setAlerts(alertsData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.title.toLowerCase().includes(search.toLowerCase()) ||
        alert.device.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [search, statusFilter, severityFilter]);

  const stats = [
    {
      label: 'Alertas',
      value: alerts.length,
      icon: BellAlertIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Críticos',
      value: alerts.filter((alert) => alert.severity === 'critical').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-red-100 text-red-700',
    },
    {
      label: 'Resolvidos',
      value: alerts.filter((alert) => alert.status === 'resolved').length,
      icon: CheckCircleIcon,
      tone: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando alertas...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('alerts.title', 'Alertas')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('alerts.description', 'Acompanhe incidentes, severidade e resolução.')}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="-ml-1 mr-2 h-5 w-5" />
          Configurar alertas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg bg-white p-5 shadow">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-semibold text-gray-900">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-white p-4 shadow sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por alerta ou dispositivo"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="all">Status: Todos</option>
            <option value="open">Aberto</option>
            <option value="acknowledged">Reconhecido</option>
            <option value="resolved">Resolvido</option>
          </select>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="all">Severidade: Todas</option>
            <option value="critical">Crítico</option>
            <option value="warning">Aviso</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Fila de alertas</h2>
          <p className="mt-1 text-sm text-gray-500">Priorize eventos críticos e acompanhe resolução.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert) => (
            <div key={alert.id} className="px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyles[alert.severity]}`}>
                      {alert.severity === 'critical'
                        ? 'Crítico'
                        : alert.severity === 'warning'
                        ? 'Aviso'
                        : 'Info'}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{alert.description}</p>
                  <p className="mt-2 text-xs text-gray-400">{alert.device}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[alert.status]}`}>
                    {statusLabels[alert.status]}
                  </span>
                  <span className="text-xs text-gray-400">{alert.time}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openView(alert)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </button>
                    {alert.status !== 'acknowledged' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(alert.id, 'acknowledged')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Reconhecer
                      </button>
                    )}
                    {alert.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(alert.id, 'resolved')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Resolver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(alert)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Detalhes do alerta"
        widthClass="max-w-xl"
      >
        {selected ? (
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Severidade</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyles[selected.severity]}`}>
                {selected.severity === 'critical'
                  ? 'Crítico'
                  : selected.severity === 'warning'
                  ? 'Aviso'
                  : 'Info'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[selected.status]}`}>
                {statusLabels[selected.status]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Dispositivo</span>
              <span className="font-medium text-gray-900">{selected.device}</span>
            </div>
            <div>
              <span className="text-gray-500">Descrição</span>
              <p className="mt-1 text-gray-700">{selected.description}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Alerts;
