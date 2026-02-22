import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommandLineIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  WifiIcon,
  ChartBarIcon,
  SignalIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { apiGet, apiPost } from '../lib/api';

const toolTabs = [
  {
    id: 'ping',
    label: 'Ping contínuo',
    icon: ArrowPathIcon,
    description: 'Mede latência, jitter e perda em tempo real.',
  },
  {
    id: 'mtr',
    label: 'MTR gráfico',
    icon: ChartBarIcon,
    description: 'Combina traceroute e ping por salto.',
  },
  {
    id: 'traceroute',
    label: 'Traceroute',
    icon: CommandLineIcon,
    description: 'Rota hop-by-hop até o destino.',
  },
  {
    id: 'dns',
    label: 'Consulta DNS',
    icon: GlobeAltIcon,
    description: 'Resolução A/AAAA/CNAME com TTL.',
  },
  {
    id: 'port_scan',
    label: 'Scanner de Portas',
    icon: ShieldCheckIcon,
    description: 'Verifica portas TCP/UDP críticas.',
  },
  {
    id: 'http_check',
    label: 'Teste HTTP/HTTPS',
    icon: ArrowTopRightOnSquareIcon,
    description: 'Valida status, TLS e tempo de resposta.',
  },
  {
    id: 'ip_scan',
    label: 'Scanner de IP',
    icon: WifiIcon,
    description: 'Descobre hosts ativos por faixa.',
  },
];

const defaultInputs = {
  target: '8.8.8.8',
  count: 5,
  intervalMs: 1000,
  maxHops: 6,
  dnsType: 'A',
  ports: '22,53,80,443,8291',
  protocol: 'tcp',
  url: 'https://status.octoisp.local',
  ipRange: '192.168.1.0/28',
};

const Tools = () => {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState('ping');
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [useDevice, setUseDevice] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');
  const isPreview = import.meta.env.VITE_PREVIEW_MODE === 'true';

  const toolMeta = useMemo(
    () => toolTabs.find((tool) => tool.id === activeTool) || toolTabs[0],
    [activeTool]
  );
  const ToolIcon = toolMeta.icon;

  const loadHistory = async () => {
    try {
      const data = await apiGet('/api/tools/history');
      setHistory(data.runs || []);
    } catch (error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
    const loadDevices = async () => {
      try {
        const data = await apiGet('/api/devices');
        setDevices(data.devices || []);
      } catch (error) {
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    };
    loadDevices();
  }, []);

  const updateInput = (key) => (event) => {
    const value = event.target.value;
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const runTool = async () => {
    setRunning(true);
    try {
      if (useDevice && !selectedDeviceId) {
        toast.error('Selecione um dispositivo para execução remota.');
        setRunning(false);
        return;
      }
      const resolvedTarget =
        activeTool === 'http_check'
          ? inputs.url
          : activeTool === 'ip_scan'
          ? inputs.ipRange
          : inputs.target;
      const payload = {
        tool: activeTool,
        target: resolvedTarget,
        deviceId: useDevice && selectedDeviceId ? selectedDeviceId : undefined,
        parameters: {
          count: Number(inputs.count),
          intervalMs: Number(inputs.intervalMs),
          maxHops: Number(inputs.maxHops),
          dnsType: inputs.dnsType,
          ports: inputs.ports,
          protocol: inputs.protocol,
        },
      };
      const data = await apiPost('/api/tools/run', payload);
      setResult(data);
      toast.success('Diagnóstico concluído.');
      loadHistory();
    } catch (error) {
      toast.error('Falha ao executar a ferramenta.');
    } finally {
      setRunning(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  const pingSeries = result?.data?.samples || [];
  const mtrSeries = result?.data?.hops || [];
  const filteredDevices = useMemo(() => {
    const query = deviceSearch.trim().toLowerCase();
    if (!query) return devices.slice(0, 50);
    return devices
      .filter((device) => {
        const name = `${device.name || ''} ${device.serialNumber || ''} ${device.ipAddress || ''}`;
        return name.toLowerCase().includes(query);
      })
      .slice(0, 50);
  }, [devices, deviceSearch]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('tools.title', 'Ferramentas de Rede')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t(
              'tools.description',
              'Diagnóstico completo para NOC com histórico e execução guiada.'
            )}
          </p>
        </div>
        <div className="rounded-full bg-sky-50 px-4 py-2 text-sm text-sky-700">
          Acesso controlado por permissão
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="panel-sm animate-rise">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Ferramentas disponíveis
          </p>
          <div className="mt-4 space-y-2">
            {toolTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTool(tab.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/60'
                  }`}
                >
                  <span
                    className={`mt-1 flex h-8 w-8 items-center justify-center rounded-md ${
                      isActive ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{tab.label}</span>
                    <span className="mt-1 block text-xs text-gray-500">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
            <div className="panel animate-rise">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <ToolIcon className="h-5 w-5 text-sky-600" />
                  {toolMeta.label}
                </div>
                  <p className="mt-1 text-sm text-gray-500">{toolMeta.description}</p>
                </div>
              {isPreview && (
                <div className="text-xs text-gray-400">Modo preview com respostas simuladas</div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-lg border border-sky-100 bg-sky-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-sky-700">Executar em dispositivo</p>
                    <p className="text-xs text-sky-600">
                      Vincule a execução ao CPE/ONT para salvar por Cliente e POP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseDevice((prev) => !prev)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                      useDevice ? 'bg-sky-600 text-white' : 'bg-white text-sky-700 border border-sky-200'
                    }`}
                  >
                    {useDevice ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                {useDevice && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-sky-700">
                        Buscar dispositivo
                      </label>
                      <input
                        type="text"
                        value={deviceSearch}
                        onChange={(event) => setDeviceSearch(event.target.value)}
                        className="mt-2 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                        placeholder="Nome, serial ou IP"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-sky-700">
                        Selecionar
                      </label>
                      <select
                        value={selectedDeviceId}
                        onChange={(event) => setSelectedDeviceId(event.target.value)}
                        className="mt-2 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                      >
                        <option value="">
                          {loadingDevices ? 'Carregando...' : 'Escolha um dispositivo'}
                        </option>
                        {filteredDevices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name || device.serialNumber} • {device.ipAddress || 'Sem IP'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              {(activeTool === 'ping' ||
                activeTool === 'mtr' ||
                activeTool === 'traceroute' ||
                activeTool === 'dns' ||
                activeTool === 'port_scan') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Destino</label>
                  <input
                    type="text"
                    value={inputs.target}
                    onChange={updateInput('target')}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    placeholder="IP ou domínio"
                  />
                </div>
              )}

              {activeTool === 'ping' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pacotes</label>
                    <input
                      type="number"
                      value={inputs.count}
                      onChange={updateInput('count')}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Intervalo (ms)</label>
                    <input
                      type="number"
                      value={inputs.intervalMs}
                      onChange={updateInput('intervalMs')}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    />
                  </div>
                </>
              )}

              {activeTool === 'mtr' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Máx. saltos</label>
                  <input
                    type="number"
                    value={inputs.maxHops}
                    onChange={updateInput('maxHops')}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  />
                </div>
              )}

              {activeTool === 'dns' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={inputs.dnsType}
                    onChange={updateInput('dnsType')}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  >
                    <option value="A">A</option>
                    <option value="AAAA">AAAA</option>
                    <option value="CNAME">CNAME</option>
                    <option value="TXT">TXT</option>
                  </select>
                </div>
              )}

              {activeTool === 'port_scan' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Portas</label>
                    <input
                      type="text"
                      value={inputs.ports}
                      onChange={updateInput('ports')}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                      placeholder="22,80,443"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Protocolo</label>
                    <select
                      value={inputs.protocol}
                      onChange={updateInput('protocol')}
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                    </select>
                  </div>
                </>
              )}

              {activeTool === 'http_check' && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">URL</label>
                  <input
                    type="text"
                    value={inputs.url}
                    onChange={updateInput('url')}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    placeholder="https://"
                  />
                </div>
              )}

              {activeTool === 'ip_scan' && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Faixa (CIDR)</label>
                  <input
                    type="text"
                    value={inputs.ipRange}
                    onChange={updateInput('ipRange')}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    placeholder="192.168.1.0/28"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                Execução registrada no histórico do provedor e vinculada ao Cliente/POP quando aplicável.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearResult}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={runTool}
                  disabled={running}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
                >
                  {running ? 'Executando...' : 'Executar'}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-gray-900 p-4 text-xs text-green-200">
                <pre className="whitespace-pre-wrap">{result?.output || 'Sem execução ainda.'}</pre>
              </div>

              <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <SignalIcon className="h-4 w-4 text-sky-600" />
                  Métricas rápidas
                </div>
                {result?.device && (
                  <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-700">
                    <p className="font-semibold">Vínculo com dispositivo</p>
                    <p>Dispositivo: {result.device.name || '—'}</p>
                    <p>Cliente: {result.device.customerName || '—'}</p>
                    <p>POP: {result.device.popName || '—'}</p>
                  </div>
                )}
                {activeTool === 'ping' && pingSeries.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pingSeries}>
                        <defs>
                          <linearGradient id="pingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="seq" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="latencyMs"
                          stroke="#0ea5e9"
                          fill="url(#pingGradient)"
                          name="Latência (ms)"
                          isAnimationActive
                          animationDuration={900}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTool === 'mtr' && mtrSeries.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mtrSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hop" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgMs" fill="#38bdf8" name="Latência média (ms)" isAnimationActive animationDuration={900} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTool !== 'ping' && activeTool !== 'mtr' && (
                  <div className="text-sm text-gray-500">
                    Execute a ferramenta para ver métricas detalhadas.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel animate-rise">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Histórico recente</h2>
                <p className="text-sm text-gray-500">Últimas execuções da equipe.</p>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                className="text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                Atualizar
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Ferramenta</th>
                    <th className="px-4 py-2 text-left">Destino</th>
                    <th className="px-4 py-2 text-left">Dispositivo</th>
                    <th className="px-4 py-2 text-left">Cliente / POP</th>
                    <th className="px-4 py-2 text-left">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-sm text-gray-700">
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500">
                        Nenhuma execução registrada.
                      </td>
                    </tr>
                  )}
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.toolLabel}</td>
                      <td className="px-4 py-3 text-gray-500">{item.target}</td>
                      <td className="px-4 py-3 text-gray-500">{item.deviceName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.customerName || '—'}
                        {item.popName ? ` • ${item.popName}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
