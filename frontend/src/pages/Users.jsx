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

const usersData = [
  {
    id: 'user-001',
    name: 'Administrador Global',
    email: 'admin@octoisp.local',
    role: 'Administrador',
    status: 'active',
    lastLogin: '2026-02-20 08:12',
  },
  {
    id: 'user-002',
    name: 'Analista NOC',
    email: 'noc@octoisp.local',
    role: 'NOC',
    status: 'active',
    lastLogin: '2026-02-20 07:54',
  },
  {
    id: 'user-003',
    name: 'Técnico Field',
    email: 'tecnico@octoisp.local',
    role: 'Técnico',
    status: 'invited',
    lastLogin: '—',
  },
  {
    id: 'user-004',
    name: 'Visualizador',
    email: 'viewer@octoisp.local',
    role: 'Visualizador',
    status: 'suspended',
    lastLogin: '2026-02-10 19:20',
  },
];

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  invited: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: 'Ativo',
  invited: 'Convidado',
  suspended: 'Suspenso',
};

const emptyUser = {
  name: '',
  email: '',
  role: 'noc_operator',
  status: 'invited',
  lastLogin: '—',
};

const Users = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyUser);

  const normalizeRole = (role) => {
    if (!role) return 'viewer';
    const normalized = role.toString().toLowerCase();
    if (normalized.includes('admin')) return 'admin_provider';
    if (normalized.includes('noc')) return 'noc_operator';
    if (normalized.includes('técnico') || normalized.includes('tecnico')) return 'technician';
    if (normalized.includes('visual')) return 'viewer';
    if (['admin_provider', 'admin_global', 'noc_operator', 'technician', 'viewer'].includes(normalized)) {
      return normalized;
    }
    return 'viewer';
  };

  const openCreate = () => {
    setModalMode('create');
    setSelected(null);
    setForm(emptyUser);
    setModalOpen(true);
  };

  const openView = (user) => {
    setModalMode('view');
    setSelected(user);
    setForm(user);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setModalMode('edit');
    setSelected(user);
    setForm({ ...user, role: normalizeRole(user.role || user.roleLabel) });
    setModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Excluir ${user.name}?`)) return;
    try {
      await apiDelete(`/api/users/${user.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      toast.success('Usuário removido.');
    } catch (error) {
      toast.error('Falha ao remover usuário.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Preencha nome e e-mail.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await apiPost('/api/users', form);
        setUsers((prev) => [{ ...form, ...created }, ...prev]);
        toast.success('Usuário convidado.');
      }

      if (modalMode === 'edit' && selected) {
        await apiPut(`/api/users/${selected.id}`, form);
        setUsers((prev) =>
          prev.map((item) => (item.id === selected.id ? { ...item, ...form } : item))
        );
        toast.success('Usuário atualizado.');
      }

      setModalOpen(false);
    } catch (error) {
      toast.error('Falha ao salvar usuário.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/users');
        setUsers(data.users || usersData);
      } catch (error) {
        toast.error('Falha ao carregar usuários.');
        setUsers(usersData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = [
    {
      label: 'Usuários',
      value: users.length,
      icon: UserGroupIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Ativos',
      value: users.filter((user) => user.status === 'active').length,
      icon: CheckCircleIcon,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Suspensos',
      value: users.filter((user) => user.status === 'suspended').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando usuários...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('users.title', 'Usuários')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('users.description', 'Controle de acesso e perfis por equipe.')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Convidar usuário
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
              placeholder="Buscar por nome ou e-mail"
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
            <option value="invited">Convidado</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Equipe</h2>
          <p className="mt-1 text-sm text-gray-500">Perfis, status e últimos acessos.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Perfil</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Último login</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.roleLabel || user.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[user.status]}`}>
                      {statusLabels[user.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openView(user)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
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
            ? 'Convidar usuário'
            : modalMode === 'edit'
            ? 'Editar usuário'
            : 'Detalhes do usuário'
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
            <label className="text-sm font-medium text-gray-700">Perfil</label>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            >
              <option value="admin_provider">Administrador</option>
              <option value="noc_operator">NOC</option>
              <option value="technician">Técnico</option>
              <option value="viewer">Visualizador</option>
            </select>
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
              <option value="invited">Convidado</option>
              <option value="suspended">Suspenso</option>
            </select>
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

export default Users;
