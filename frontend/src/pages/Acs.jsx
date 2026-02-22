import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  WifiIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const sessionsData = [
  { id: 'sess-01', device: 'CPE Cliente 001', status: 'active', lastContact: '30s', ip: '192.168.1.10' },
  { id: 'sess-02', device: 'CPE Cliente 002', status: 'idle', lastContact: '3 min', ip: '192.168.1.11' },
  { id: 'sess-03', device: 'OLT Matriz', status: 'active', lastContact: '1 min', ip: '10.0.10.2' },
];

const templates = [
  { id: 'tpl-01', name: 'Fibra Residencial', version: 'v2.3', devices: 1240 },
  { id: 'tpl-02', name: 'Fibra Empresarial', version: 'v1.9', devices: 420 },
  { id: 'tpl-03', name: 'Backup LTE', version: 'v1.2', devices: 92 },
];

const statusStyles = {
  active: 'bg-green-100 text-green-800',
  idle: 'bg-amber-100 text-amber-800',
};

const Acs = () => {
  const { t } = useTranslation();
  const [deviceId, setDeviceId] = useState('CPE Cliente 001');
  const [command, setCommand] = useState('Reboot');
  const [queue, setQueue] = useState([
    { id: 'cmd-01', device: 'CPE Cliente 002', command: 'GetParameters', status: 'queued' },
    { id: 'cmd-02', device: 'OLT Matriz', command: 'SetWiFi', status: 'sent' },
  ]);

  const enqueueCommand = () => {
    const newItem = {
      id: `cmd-${Date.now()}`,
      device: deviceId,
      command,
      status: 'queued',
    };
    setQueue((prev) => [newItem, ...prev]);
    toast.success('Comando enviado para fila.');
  };

  const handleDelete = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    toast.success('Comando removido.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('acs.title', 'ACS / TR-069')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('acs.description', 'Provisionamento remoto e controle de sessões.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <WifiIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessões ativas</p>
              <p className="text-xl font-semibold text-gray-900">18</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sucesso hoje</p>
              <p className="text-xl font-semibold text-gray-900">96,4%</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Comandos pendentes</p>
              <p className="text-xl font-semibold text-gray-900">{queue.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Falhas críticas</p>
              <p className="text-xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Enviar comando</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Dispositivo</label>
              <input
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comando</label>
              <select
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              >
                <option>Reboot</option>
                <option>GetParameters</option>
                <option>SetWiFi</option>
                <option>FirmwareUpgrade</option>
              </select>
            </div>
            <button
              type="button"
              onClick={enqueueCommand}
              className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />
              Enviar para fila
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Fila de comandos</h2>
            <p className="mt-1 text-sm text-gray-500">Monitoramento das execuções TR-069.</p>
          </div>
          <div className="divide-y divide-gray-200">
            {queue.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.device}</p>
                    <p className="text-xs text-gray-500">{item.command}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {item.status === 'queued' ? 'Na fila' : 'Enviado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Sessões recentes</h2>
          <p className="mt-1 text-sm text-gray-500">Último contato com CPE/ONT.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dispositivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Último contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sessionsData.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{session.device}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{session.ip}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[session.status]}`}>
                      {session.status === 'active' ? 'Ativo' : 'Ocioso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{session.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Templates de provisionamento</h2>
          <p className="mt-1 text-sm text-gray-500">Perfis aplicados por modelo de dispositivo.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {templates.map((template) => (
            <div key={template.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500">Versão {template.version}</p>
                </div>
                <span className="text-xs text-gray-500">{template.devices} dispositivos</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Acs;
