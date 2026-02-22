import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingOfficeIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';

const popsData = [
  {
    id: 'pop-01',
    name: 'POP Centro',
    city: 'São Paulo',
    status: 'online',
    customers: 3120,
    devices: 420,
    utilization: '62%',
    latency: '9 ms',
    uplink: '2x 10Gb',
  },
  {
    id: 'pop-02',
    name: 'POP Norte',
    city: 'Guarulhos',
    status: 'online',
    customers: 1850,
    devices: 260,
    utilization: '48%',
    latency: '11 ms',
    uplink: '1x 10Gb',
  },
  {
    id: 'pop-03',
    name: 'POP Sul',
    city: 'Santo André',
    status: 'degraded',
    customers: 980,
    devices: 140,
    utilization: '79%',
    latency: '28 ms',
    uplink: '1x 5Gb',
  },
  {
    id: 'pop-04',
    name: 'POP Leste',
    city: 'São Caetano',
    status: 'online',
    customers: 1420,
    devices: 200,
    utilization: '55%',
    latency: '13 ms',
    uplink: '2x 5Gb',
  },
  {
    id: 'pop-05',
    name: 'POP Oeste',
    city: 'Osasco',
    status: 'offline',
    customers: 640,
    devices: 90,
    utilization: '0%',
    latency: '—',
    uplink: '1x 5Gb',
  },
];

const statusStyles = {
  online: 'bg-green-100 text-green-800',
  degraded: 'bg-amber-100 text-amber-800',
  offline: 'bg-red-100 text-red-800',
};

const statusLabels = {
  online: 'Online',
  degraded: 'Degradado',
  offline: 'Offline',
};

const emptyPop = {
  name: '',
  city: '',
  status: 'online',
  customers: 0,
  devices: 0,
  utilization: '',
  latency: '',
  uplink: '',
};

const Pops = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pops, setPops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyPop);

  const openCreate = () => {
    setModalMode('create');
    setSelected(null);
    setForm(emptyPop);
    setModalOpen(true);
  };

  const openView = (pop) => {
    setModalMode('view');
    setSelected(pop);
    setForm(pop);
    setModalOpen(true);
  };

  const openEdit = (pop) => {
    setModalMode('edit');
    setSelected(pop);
    setForm(pop);
    setModalOpen(true);
  };

  const handleDelete = async (pop) => {
    if (!window.confirm(`Excluir ${pop.name}?`)) return;
    try {
      await apiDelete(`/api/pops/${pop.id}`);
      setPops((prev) => prev.filter((item) => item.id !== pop.id));
      toast.success('POP excluído.');
    } catch (error) {
      toast.error('Falha ao excluir POP.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.city) {
      toast.error('Preencha nome e cidade.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await apiPost('/api/pops', form);
        setPops((prev) => [{ ...form, ...created }, ...prev]);
        toast.success('POP cadastrado.');
      }

      if (modalMode === 'edit' && selected) {
        const updated = await apiPut(`/api/pops/${selected.id}`, form);
        setPops((prev) =>
          prev.map((item) => (item.id === selected.id ? { ...item, ...updated } : item))
        );
        toast.success('POP atualizado.');
      }

      setModalOpen(false);
    } catch (error) {
      toast.error('Falha ao salvar POP.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/pops');
        setPops(data.pops || popsData);
      } catch (error) {
        toast.error('Falha ao carregar POPs.');
        setPops(popsData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPops = useMemo(() => {
    return pops.filter((pop) => {
      const matchesSearch =
        pop.name.toLowerCase().includes(search.toLowerCase()) ||
        (pop.city || pop.location || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pop.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = [
    {
      label: 'POPs',
      value: pops.length,
      icon: BuildingOfficeIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Online',
      value: pops.filter((pop) => pop.status === 'online').length,
      icon: SignalIcon,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Degradados',
      value: pops.filter((pop) => pop.status === 'degraded').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Offline',
      value: pops.filter((pop) => pop.status === 'offline').length,
      icon: ArrowPathIcon,
      tone: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando POPs...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('pops.title', 'POPs')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('pops.description', 'Operação e status dos pontos de presença.')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo POP
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por POP ou cidade"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="all">Status: Todos</option>
            <option value="online">Online</option>
            <option value="degraded">Degradado</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Resumo operacional</h2>
          <p className="mt-1 text-sm text-gray-500">Utilização, latência e capacidade de uplink.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">POP</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dispositivos</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Utilização</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Latência</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uplink</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPops.map((pop) => (
                <tr key={pop.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{pop.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.city || pop.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[pop.status]}`}>
                      {statusLabels[pop.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.customers}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.devices}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pop.utilization ? `${pop.utilization}%` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pop.latency ? `${pop.latency} ms` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pop.uplink || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/pop-monitoring?popId=${pop.id}`}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                        Monitorar
                      </Link>
                      <button
                        type="button"
                        onClick={() => openView(pop)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(pop)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pop)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'Cadastrar POP'
            : modalMode === 'edit'
            ? 'Editar POP'
            : 'Detalhes do POP'
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cidade</label>
            <input
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            >
              <option value="online">Online</option>
              <option value="degraded">Degradado</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Uplink</label>
            <input
              value={form.uplink}
              onChange={(event) => setForm((prev) => ({ ...prev, uplink: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Utilização</label>
            <input
              value={form.utilization}
              onChange={(event) => setForm((prev) => ({ ...prev, utilization: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Latência</label>
            <input
              value={form.latency}
              onChange={(event) => setForm((prev) => ({ ...prev, latency: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
        </div>
        {modalMode !== 'view' && (
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Salvar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pops;
