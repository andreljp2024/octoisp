import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserGroupIcon,
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

const customersData = [
  {
    id: 'cust-1001',
    name: 'Cliente Exemplo 1',
    email: 'cliente1@exemplo.com',
    phone: '+55 11 99999-9999',
    plan: 'Fibra 300Mbps',
    status: 'active',
    city: 'São Paulo',
    devices: 1,
    lastBilling: '2026-02-12',
  },
  {
    id: 'cust-1002',
    name: 'Cliente Exemplo 2',
    email: 'cliente2@exemplo.com',
    phone: '+55 11 98888-8888',
    plan: 'Fibra 500Mbps',
    status: 'active',
    city: 'Guarulhos',
    devices: 2,
    lastBilling: '2026-02-15',
  },
  {
    id: 'cust-1003',
    name: 'Cliente Inadimplente',
    email: 'cliente3@exemplo.com',
    phone: '+55 11 97777-7777',
    plan: 'Fibra 200Mbps',
    status: 'delinquent',
    city: 'Osasco',
    devices: 1,
    lastBilling: '2026-01-28',
  },
  {
    id: 'cust-1004',
    name: 'Cliente Suspenso',
    email: 'cliente4@exemplo.com',
    phone: '+55 11 96666-6666',
    plan: 'Fibra 700Mbps',
    status: 'suspended',
    city: 'Santo André',
    devices: 3,
    lastBilling: '2025-12-05',
  },
  {
    id: 'cust-1005',
    name: 'Cliente PME',
    email: 'cliente5@exemplo.com',
    phone: '+55 11 95555-5555',
    plan: 'Fibra Empresarial 1Gbps',
    status: 'active',
    city: 'São Caetano',
    devices: 4,
    lastBilling: '2026-02-10',
  },
];

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  delinquent: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: 'Ativo',
  delinquent: 'Inadimplente',
  suspended: 'Suspenso',
};

const emptyCustomer = {
  name: '',
  email: '',
  phone: '',
  plan: '',
  status: 'active',
  city: '',
  devices: 0,
  lastBilling: '',
};

const Customers = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCustomer);

  const openCreate = () => {
    setModalMode('create');
    setSelected(null);
    setForm(emptyCustomer);
    setModalOpen(true);
  };

  const openView = (customer) => {
    setModalMode('view');
    setSelected(customer);
    setForm(customer);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setModalMode('edit');
    setSelected(customer);
    setForm(customer);
    setModalOpen(true);
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Excluir ${customer.name}?`)) return;
    try {
      await apiDelete(`/api/customers/${customer.id}`);
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
      toast.success('Cliente excluído.');
    } catch (error) {
      toast.error('Falha ao excluir cliente.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Preencha nome e e-mail.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await apiPost('/api/customers', form);
        setCustomers((prev) => [{ ...form, ...created }, ...prev]);
        toast.success('Cliente cadastrado.');
      }

      if (modalMode === 'edit' && selected) {
        const updated = await apiPut(`/api/customers/${selected.id}`, form);
        setCustomers((prev) =>
          prev.map((item) => (item.id === selected.id ? { ...item, ...updated } : item))
        );
        toast.success('Cliente atualizado.');
      }

      setModalOpen(false);
    } catch (error) {
      toast.error('Falha ao salvar cliente.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/customers');
        setCustomers(data.customers || customersData);
      } catch (error) {
        toast.error('Falha ao carregar clientes.');
        setCustomers(customersData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone || '').includes(search);

      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = [
    {
      label: 'Clientes',
      value: customers.length,
      icon: UserGroupIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Ativos',
      value: customers.filter((customer) => customer.status === 'active').length,
      icon: CheckCircleIcon,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Inadimplentes',
      value: customers.filter((customer) => customer.status === 'delinquent').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando clientes...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('customers.title', 'Clientes')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('customers.description', 'Gestão de contratos, status e faturamento.')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo cliente
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
              placeholder="Buscar por nome, e-mail ou telefone"
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
            <option value="delinquent">Inadimplente</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Carteira de clientes</h2>
          <p className="mt-1 text-sm text-gray-500">Dados de contato, plano e faturamento.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dispositivos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Último faturamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.plan || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[customer.status]}`}
                    >
                      {statusLabels[customer.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.devices}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.lastBilling || customer.lastBillingDate || '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openView(customer)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(customer)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(customer)}
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
            ? 'Cadastrar cliente'
            : modalMode === 'edit'
            ? 'Editar cliente'
            : 'Detalhes do cliente'
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
            <label className="text-sm font-medium text-gray-700">E-mail</label>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
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
              <option value="delinquent">Inadimplente</option>
              <option value="suspended">Suspenso</option>
            </select>
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

export default Customers;
