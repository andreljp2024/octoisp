import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CpuChipIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';

const devicesData = [
  {
    id: 'device-core-01',
    name: 'Core Router 01',
    type: 'Core Router',
    model: 'Cisco ASR 1001',
    status: 'online',
    ipAddress: '10.0.0.1',
    customer: 'NOC Central',
    location: 'POP Centro',
    lastSeen: 'Agora',
  },
  {
    id: 'device-cpe-001',
    name: 'CPE Cliente 001',
    type: 'CPE',
    model: 'Huawei HG8245H',
    status: 'online',
    ipAddress: '192.168.1.1',
    customer: 'Cliente Exemplo 1',
    location: 'São Paulo',
    lastSeen: '2 min atrás',
  },
  {
    id: 'device-cpe-002',
    name: 'CPE Cliente 002',
    type: 'CPE',
    model: 'ZTE F660',
    status: 'offline',
    ipAddress: '192.168.1.2',
    customer: 'Cliente Exemplo 2',
    location: 'Guarulhos',
    lastSeen: '1h atrás',
  },
  {
    id: 'device-sw-003',
    name: 'Switch POP Sul',
    type: 'Switch',
    model: 'Ubiquiti EdgeSwitch 48',
    status: 'degraded',
    ipAddress: '10.2.0.12',
    customer: 'POP Sul',
    location: 'Santo André',
    lastSeen: '5 min atrás',
  },
  {
    id: 'device-olt-004',
    name: 'OLT Matriz',
    type: 'OLT',
    model: 'Nokia FX-8',
    status: 'online',
    ipAddress: '10.0.10.2',
    customer: 'Matriz',
    location: 'São Paulo',
    lastSeen: 'Agora',
  },
  {
    id: 'device-core-05',
    name: 'Core Router 02',
    type: 'Core Router',
    model: 'Juniper MX204',
    status: 'online',
    ipAddress: '10.0.0.2',
    customer: 'Backbone',
    location: 'POP Norte',
    lastSeen: '1 min atrás',
  },
];

const statusStyles = {
  online: 'bg-green-100 text-green-800',
  degraded: 'bg-amber-100 text-amber-800',
  offline: 'bg-red-100 text-red-800',
};

const typeLabels = {
  cpe: 'CPE',
  ont: 'ONT',
  olt: 'OLT',
  router: 'Core Router',
  switch: 'Switch',
  ap: 'AP',
};

const emptyDevice = {
  name: '',
  type: 'CPE',
  model: '',
  status: 'online',
  ipAddress: '',
  customer: '',
  location: '',
};

const Devices = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyDevice);

  const openCreate = () => {
    setModalMode('create');
    setSelected(null);
    setForm(emptyDevice);
    setModalOpen(true);
  };

  const openView = (device) => {
    setModalMode('view');
    setSelected(device);
    setForm(device);
    setModalOpen(true);
  };

  const openEdit = (device) => {
    setModalMode('edit');
    setSelected(device);
    setForm(device);
    setModalOpen(true);
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Excluir ${device.name}?`)) return;
    try {
      await apiDelete(`/api/devices/${device.id}`);
      setDevices((prev) => prev.filter((item) => item.id !== device.id));
      toast.success('Dispositivo excluído.');
    } catch (error) {
      toast.error('Falha ao excluir dispositivo.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.ipAddress) {
      toast.error('Preencha nome e IP.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const created = await apiPost('/api/devices', form);
        setDevices((prev) => [created, ...prev]);
        toast.success('Dispositivo cadastrado.');
      }

      if (modalMode === 'edit' && selected) {
        const updated = await apiPut(`/api/devices/${selected.id}`, form);
        setDevices((prev) =>
          prev.map((item) => (item.id === selected.id ? updated : item))
        );
        toast.success('Dispositivo atualizado.');
      }

      setModalOpen(false);
    } catch (error) {
      toast.error('Falha ao salvar dispositivo.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/devices');
        const normalized = (data.devices || devicesData).map((device) => ({
          ...device,
          type: typeLabels[device.type?.toLowerCase?.()] || device.type || 'CPE',
        }));
        setDevices(normalized);
      } catch (error) {
        toast.error('Falha ao carregar dispositivos.');
        setDevices(devicesData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(search.toLowerCase()) ||
        device.ipAddress.includes(search) ||
        device.model.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesType = typeFilter === 'all' || device.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const stats = [
    {
      label: 'Total',
      value: devices.length,
      icon: CpuChipIcon,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Online',
      value: devices.filter((device) => device.status === 'online').length,
      icon: SignalIcon,
      tone: 'bg-green-100 text-green-700',
    },
    {
      label: 'Degradados',
      value: devices.filter((device) => device.status === 'degraded').length,
      icon: ExclamationTriangleIcon,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Offline',
      value: devices.filter((device) => device.status === 'offline').length,
      icon: ArrowPathIcon,
      tone: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando dispositivos...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('devices.title', 'Dispositivos')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('devices.description', 'Inventário e status operacional dos dispositivos.')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo dispositivo
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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, IP ou modelo"
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
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
          >
            <option value="all">Tipo: Todos</option>
            <option value="Core Router">Core Router</option>
            <option value="CPE">CPE</option>
            <option value="Switch">Switch</option>
            <option value="OLT">OLT</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Lista de dispositivos</h2>
          <p className="mt-1 text-sm text-gray-500">Acompanhe estado e última atividade.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dispositivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Última atividade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDevices.map((device) => (
                <tr key={device.id}>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-semibold text-gray-900">{device.name}</p>
                    <p className="text-xs text-gray-500">
                      {device.type} • {device.model} • {device.location}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{device.customer || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[device.status] || statusStyles.offline}`}
                    >
                      {device.status === 'online'
                        ? 'Online'
                        : device.status === 'degraded'
                        ? 'Degradado'
                        : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{device.ipAddress}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{device.lastSeen}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openView(device)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(device)}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(device)}
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
            ? 'Cadastrar dispositivo'
            : modalMode === 'edit'
            ? 'Editar dispositivo'
            : 'Detalhes do dispositivo'
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
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            >
              <option>Core Router</option>
              <option>CPE</option>
              <option>Switch</option>
              <option>OLT</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Modelo</label>
            <input
              value={form.model}
              onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
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
            <label className="text-sm font-medium text-gray-700">IP</label>
            <input
              value={form.ipAddress}
              onChange={(event) => setForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cliente</label>
            <input
              value={form.customer}
              onChange={(event) => setForm((prev) => ({ ...prev, customer: event.target.value }))}
              disabled={modalMode === 'view'}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Local</label>
            <input
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
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

export default Devices;
