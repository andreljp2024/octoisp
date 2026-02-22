import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';

const providersData = [
  {
    id: 'prov-01',
    name: 'ISP Alpha Telecom',
    status: 'active',
    plan: 'Enterprise',
    customers: 8420,
    pops: 5,
    lastInvoice: '2026-02-10',
    sla: '99,9%',
  },
  {
    id: 'prov-02',
    name: 'NetSul Fibra',
    status: 'active',
    plan: 'Growth',
    customers: 3200,
    pops: 3,
    lastInvoice: '2026-02-07',
    sla: '99,5%',
  },
  {
    id: 'prov-03',
    name: 'Conecta Leste',
    status: 'pending',
    plan: 'Starter',
    customers: 780,
    pops: 1,
    lastInvoice: '2026-01-28',
    sla: '98,7%',
  },
  {
    id: 'prov-04',
    name: 'NorteLink',
    status: 'suspended',
    plan: 'Growth',
    customers: 1450,
    pops: 2,
    lastInvoice: '2025-12-15',
    sla: '97,9%',
  },
];

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: 'Ativo',
  pending: 'Pendente',
  suspended: 'Suspenso',
};

const emptyProvider = {
  name: '',
  status: 'active',
  plan: '',
  customers: 0,
  pops: 0,
  lastInvoice: '',
  sla: '',
};

const Providers = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyProvider);

  const openCreate = () => {
    setModalMode('create');
    setSelected(null);
    setForm(emptyProvider);
    setModalOpen(true);
  };

  const openView = (provider) => {
    setModalMode('view');
    setSelected(provider);
    setForm(provider);
    setModalOpen(true);
  };

  const openEdit = (provider) => {
    setModalMode('edit');
    setSelected(provider);
    setForm(provider);
    setModalOpen(true);
  };

  const handleDelete = async (provider) => {
    if (!window.confirm(`Excluir ${provider.name}?`)) return;
    try {
      await apiDelete(`/api/providers/${provider.id}`);
      setProviders((prev) => prev.filter((item) => item.id !== provider.id));
      toast.success('Provedor excluído.');
    } catch (error) {
      toast.error('Falha ao excluir provedor.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.plan) {
      toast.error('Preencha nome e plano.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await apiPost('/api/providers', form);
        setProviders((prev) => [{ ...form, ...created }, ...prev]);
        toast.success('Provedor cadastrado.');
      }

      if (modalMode === 'edit' && selected) {
        const updated = await apiPut(`/api/providers/${selected.id}`, form);
        setProviders((prev) =>
          prev.map((item) => (item.id === selected.id ? { ...item, ...updated } : item))
        );
        toast.success('Provedor atualizado.');
      }

      setModalOpen(false);
    } catch (error) {
      toast.error('Falha ao salvar provedor.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/providers');
        setProviders(data.providers || providersData);
      } catch (error) {
        toast.error('Falha ao carregar provedores.');
        setProviders(providersData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const matchesSearch = provider.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = [
    {
      label: 'Provedores',
      value: providers.length,
      icon: BuildingOfficeIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Ativos',
      value: providers.filter((provider) => provider.status === 'active').length,
      icon: CheckCircleIcon,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Pendentes',
      value: providers.filter((provider) => provider.status === 'pending').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando provedores...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('providers.title', 'Provedores')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('providers.description', 'Gestão multi-tenant de provedores, planos e SLA.')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo provedor
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome do provedor"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Ativo</option>
            <option value="pending">Pendente</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Carteira de provedores</h2>
          <p className="mt-1 text-sm text-gray-500">Visão consolidada por plano e operação.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">POPs</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SLA</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Última fatura</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProviders.map((provider) => (
                <tr key={provider.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{provider.plan || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[provider.status]}`}>
                      {statusLabels[provider.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{provider.customers}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{provider.pops}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{provider.sla || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {provider.lastInvoice || provider.lastInvoiceDate || '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openView(provider)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(provider)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(provider)}
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
            ? 'Cadastrar provedor'
            : modalMode === 'edit'
            ? 'Editar provedor'
            : 'Detalhes do provedor'
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
            <label className="text-sm font-medium text-gray-700">Plano</label>
            <input
              value={form.plan}
              onChange={(event) => setForm((prev) => ({ ...prev, plan: event.target.value }))}
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
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">SLA</label>
            <input
              value={form.sla}
              onChange={(event) => setForm((prev) => ({ ...prev, sla: event.target.value }))}
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

export default Providers;
