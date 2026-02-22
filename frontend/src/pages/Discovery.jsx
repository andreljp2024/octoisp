import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SignalIcon,
  WifiIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Discovery = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState('192.168.1.0/24');
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);

  const runDiscovery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkRange: range }),
      });
      if (!response.ok) {
        throw new Error('Falha ao iniciar descoberta');
      }
      const data = await response.json();
      setDevices(data.devices || []);
      toast.success(`Descoberta concluída: ${data.devices?.length || 0} dispositivos`);
    } catch (error) {
      toast.error('Erro na descoberta automática.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('discovery.title', 'Descoberta Automática')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t(
              'discovery.description',
              'Varredura inteligente para identificar CPEs e ONTs na rede.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={runDiscovery}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? 'Descobrindo...' : 'Iniciar descoberta'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <SignalIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Configuração da varredura</h2>
              <p className="text-sm text-gray-500">Defina o range e execute a descoberta.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Range de rede</label>
              <input
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={runDiscovery}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
              Executar agora
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <WifiIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Resumo</h2>
              <p className="text-sm text-gray-500">Dispositivos encontrados</p>
            </div>
          </div>
          <div className="mt-6 text-3xl font-semibold text-gray-900">{devices.length}</div>
          <p className="text-sm text-gray-500">Última varredura</p>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Resultados</h2>
          <p className="mt-1 text-sm text-gray-500">Dispositivos detectados na rede.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {devices.length === 0 && (
            <div className="px-6 py-6 text-sm text-gray-500">
              Nenhum dispositivo encontrado. Execute a descoberta para iniciar.
            </div>
          )}
          {devices.map((device) => (
            <div key={device.id} className="px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{device.serialNumber}</p>
                  <p className="text-xs text-gray-500">
                    {device.productClass} • {device.ip}
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700">
                  Provisionar
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discovery;
