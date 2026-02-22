import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ServerStackIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const pops = [
  { id: 'pop-norte', name: 'POP Norte' },
  { id: 'pop-centro', name: 'POP Centro' },
  { id: 'pop-sul', name: 'POP Sul' },
];

const baseEquipment = [
  {
    id: 'olt-01',
    type: 'OLT',
    name: 'OLT Matriz',
    serial: 'ZTE-OLT-88A1',
    popId: 'pop-centro',
    status: 'online',
    clients: 248,
    alerts: 1,
    rxPower: -19.4,
    txPower: 2.1,
    trafficDown: 3.4,
    trafficUp: 1.2,
    latency: 4.2,
    interfaces: [
      { name: 'PON 1/1', status: 'online', down: 1.2, up: 0.4, onts: 48 },
      { name: 'PON 1/2', status: 'degraded', down: 0.9, up: 0.3, onts: 39 },
      { name: 'PON 1/3', status: 'online', down: 0.6, up: 0.2, onts: 35 },
    ],
  },
  {
    id: 'olt-02',
    type: 'OLT',
    name: 'OLT Bairro Sul',
    serial: 'HUA-OLT-92B7',
    popId: 'pop-sul',
    status: 'warning',
    clients: 196,
    alerts: 3,
    rxPower: -23.2,
    txPower: 1.7,
    trafficDown: 2.1,
    trafficUp: 0.8,
    latency: 7.8,
    interfaces: [
      { name: 'PON 2/1', status: 'warning', down: 0.7, up: 0.2, onts: 32 },
      { name: 'PON 2/2', status: 'online', down: 0.8, up: 0.3, onts: 28 },
      { name: 'PON 2/3', status: 'online', down: 0.6, up: 0.2, onts: 24 },
    ],
  },
  {
    id: 'olt-03',
    type: 'OLT',
    name: 'OLT Zona Norte',
    serial: 'ZTE-OLT-77C2',
    popId: 'pop-norte',
    status: 'online',
    clients: 164,
    alerts: 0,
    rxPower: -18.1,
    txPower: 2.4,
    trafficDown: 1.7,
    trafficUp: 0.6,
    latency: 5.1,
    interfaces: [
      { name: 'PON 3/1', status: 'online', down: 0.5, up: 0.2, onts: 26 },
      { name: 'PON 3/2', status: 'online', down: 0.6, up: 0.2, onts: 22 },
    ],
  },
  {
    id: 'ont-01',
    type: 'ONT',
    name: 'ONT Residencial 102',
    serial: 'FHTT-ONT-0019',
    popId: 'pop-centro',
    status: 'online',
    clients: 1,
    alerts: 0,
    rxPower: -20.8,
    txPower: 1.1,
    trafficDown: 0.35,
    trafficUp: 0.12,
    latency: 9.2,
    parent: 'olt-01',
    interfaces: [
      { name: 'LAN 1', status: 'online', down: 0.18, up: 0.05, onts: 1 },
      { name: 'LAN 2', status: 'offline', down: 0.0, up: 0.0, onts: 0 },
    ],
  },
  {
    id: 'ont-02',
    type: 'ONT',
    name: 'ONT Empresarial 221',
    serial: 'FHTT-ONT-0092',
    popId: 'pop-centro',
    status: 'critical',
    clients: 1,
    alerts: 2,
    rxPower: -28.6,
    txPower: 0.6,
    trafficDown: 0.05,
    trafficUp: 0.02,
    latency: 35.4,
    parent: 'olt-01',
    interfaces: [
      { name: 'LAN 1', status: 'warning', down: 0.03, up: 0.01, onts: 1 },
    ],
  },
  {
    id: 'ont-03',
    type: 'ONT',
    name: 'ONT Residencial 309',
    serial: 'FHTT-ONT-0314',
    popId: 'pop-sul',
    status: 'online',
    clients: 1,
    alerts: 0,
    rxPower: -19.2,
    txPower: 1.4,
    trafficDown: 0.28,
    trafficUp: 0.09,
    latency: 11.1,
    parent: 'olt-02',
    interfaces: [
      { name: 'LAN 1', status: 'online', down: 0.2, up: 0.06, onts: 1 },
    ],
  },
];

const statusTone = {
  online: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  degraded: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  offline: 'bg-slate-200 text-slate-600',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createHistory = (item) =>
  Array.from({ length: 18 }).map((_, index) => ({
    time: `${index * 2}m`,
    down: Number((item.trafficDown * (0.7 + Math.random() * 0.6)).toFixed(2)),
    up: Number((item.trafficUp * (0.7 + Math.random() * 0.6)).toFixed(2)),
  }));

function OltOnt() {
  const [equipment, setEquipment] = useState(baseEquipment);
  const [history, setHistory] = useState(() =>
    Object.fromEntries(baseEquipment.map((item) => [item.id, createHistory(item)]))
  );
  const [selectedPop, setSelectedPop] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchSerial, setSearchSerial] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(baseEquipment[0].id);

  useEffect(() => {
    const interval = setInterval(() => {
      setEquipment((prev) => {
        const next = prev.map((item) => {
          const jitter = item.status === 'offline' ? 0 : 0.25;
          const trafficDown = clamp(item.trafficDown + (Math.random() - 0.4) * jitter, 0, 6);
          const trafficUp = clamp(item.trafficUp + (Math.random() - 0.4) * jitter, 0, 3);
          const latency = clamp(item.latency + (Math.random() - 0.4) * 1.4, 2, 60);
          const rxPower = clamp(item.rxPower + (Math.random() - 0.5) * 0.5, -32, -12);
          const txPower = clamp(item.txPower + (Math.random() - 0.5) * 0.2, 0.2, 3.2);
          return {
            ...item,
            trafficDown: Number(trafficDown.toFixed(2)),
            trafficUp: Number(trafficUp.toFixed(2)),
            latency: Number(latency.toFixed(1)),
            rxPower: Number(rxPower.toFixed(1)),
            txPower: Number(txPower.toFixed(1)),
          };
        });
        setHistory((prevHistory) => {
          const updated = { ...prevHistory };
          next.forEach((item) => {
            const current = prevHistory[item.id] || [];
            const trimmed = current.slice(-17);
            updated[item.id] = [
              ...trimmed,
              {
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                down: item.trafficDown,
                up: item.trafficUp,
              },
            ];
          });
          return updated;
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return equipment.filter((item) => {
      if (selectedPop !== 'all' && item.popId !== selectedPop) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchSerial && !item.serial.toLowerCase().includes(searchSerial.toLowerCase())) return false;
      if (searchName && !item.name.toLowerCase().includes(searchName.toLowerCase())) return false;
      return true;
    });
  }, [equipment, selectedPop, typeFilter, searchSerial, searchName, statusFilter]);

  useEffect(() => {
    if (!filtered.find((item) => item.id === selectedId)) {
      setSelectedId(filtered[0]?.id);
    }
  }, [filtered, selectedId]);

  const selected = equipment.find((item) => item.id === selectedId) || filtered[0];
  const selectedHistory = history[selected?.id] || [];

  const totalAlerts = filtered.reduce((acc, item) => acc + item.alerts, 0);
  const onlineCount = filtered.filter((item) => item.status === 'online').length;
  const criticalCount = filtered.filter((item) => item.status === 'critical').length;

  const flowStatus =
    selected?.status === 'critical'
      ? 'critical'
      : selected?.status === 'warning' || selected?.status === 'degraded'
      ? 'warning'
      : 'online';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">OLT/ONT em Tempo Real</h1>
          <p className="mt-1 text-sm text-gray-500">
            Inventário ao vivo com filtros por POP, equipamento e número de série.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Monitoramento ativo
        </div>
      </div>

      <div className="panel grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">POP</label>
          <select
            value={selectedPop}
            onChange={(event) => setSelectedPop(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos os POPs</option>
            {pops.map((pop) => (
              <option key={pop.id} value={pop.id}>
                {pop.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</label>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="OLT">OLT</option>
            <option value="ONT">ONT</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="online">Online</option>
            <option value="warning">Aviso</option>
            <option value="degraded">Degradado</option>
            <option value="critical">Crítico</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Equipamento</label>
          <input
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="Nome do equipamento"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Número de série</label>
          <input
            value={searchSerial}
            onChange={(event) => setSearchSerial(event.target.value)}
            placeholder="Ex: ZTE-OLT-88A1"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
              <ServerStackIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Equipamentos</p>
              <p className="text-2xl font-semibold text-gray-900">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Online</p>
              <p className="text-2xl font-semibold text-gray-900">{onlineCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-700">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Críticos</p>
              <p className="text-2xl font-semibold text-gray-900">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <BoltIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Alertas ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{totalAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="panel lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Inventário ativo</h2>
          <p className="text-sm text-gray-500">OLT/ONT com status e tráfego em tempo real.</p>
          <div className="mt-4 space-y-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selectedId === item.id
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.type} • {item.serial}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone[item.status]}`}>
                    {item.status === 'online'
                      ? 'Online'
                      : item.status === 'warning'
                      ? 'Aviso'
                      : item.status === 'degraded'
                      ? 'Degradado'
                      : item.status === 'critical'
                      ? 'Crítico'
                      : 'Offline'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ArrowTrendingDownIcon className="h-4 w-4 text-sky-500" />
                    {item.trafficDown} Mbps
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                    {item.trafficUp} Mbps
                  </div>
                  <div className="flex items-center gap-1">
                    <SignalIcon className="h-4 w-4 text-slate-500" />
                    {item.latency} ms
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>RX {item.rxPower} dBm</span>
                  <span>TX {item.txPower} dBm</span>
                  <span>{item.clients} clientes</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="chart-surface">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selected?.name || 'Selecione um equipamento'}
                </h2>
                <p className="text-sm text-gray-500">
                  {selected?.type} • {selected?.serial} • POP{' '}
                  {pops.find((pop) => pop.id === selected?.popId)?.name || '-'}
                </p>
              </div>
              {selected && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[selected.status]}`}>
                  {selected.status === 'online'
                    ? 'Online'
                    : selected.status === 'warning'
                    ? 'Aviso'
                    : selected.status === 'degraded'
                    ? 'Degradado'
                    : selected.status === 'critical'
                    ? 'Crítico'
                    : 'Offline'}
                </span>
              )}
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedHistory}>
                  <defs>
                    <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="down" stroke="#38bdf8" fill="url(#downGradient)" name="Download" />
                  <Area type="monotone" dataKey="up" stroke="#34d399" fill="url(#upGradient)" name="Upload" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-gray-500">Download atual</p>
                <p className="text-lg font-semibold text-gray-900">{selected?.trafficDown} Mbps</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-gray-500">Upload atual</p>
                <p className="text-lg font-semibold text-gray-900">{selected?.trafficUp} Mbps</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-gray-500">Latência</p>
                <p className="text-lg font-semibold text-gray-900">{selected?.latency} ms</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="panel">
              <h3 className="text-base font-semibold text-gray-900">Potência óptica</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>RX</span>
                    <span>{selected?.rxPower} dBm</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{ width: `${clamp(((selected?.rxPower || -30) + 32) * 3.1, 5, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>TX</span>
                    <span>{selected?.txPower} dBm</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-400"
                      style={{ width: `${clamp(((selected?.txPower || 0) + 1) * 28, 5, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                <SignalIcon className="h-4 w-4" />
                Sinal estável dentro do intervalo recomendado.
              </div>
            </div>
            <div className="panel">
              <h3 className="text-base font-semibold text-gray-900">Clientes conectados</h3>
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-full bg-indigo-100 p-3 text-indigo-700">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{selected?.clients || 0}</p>
                  <p className="text-xs text-gray-500">Clientes ativos neste equipamento</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                {selected?.type === 'OLT'
                  ? 'Inclui ONTs residenciais e empresariais.'
                  : 'CPE residencial monitorado via OLT.'}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="text-base font-semibold text-gray-900">Fluxograma operacional</h3>
            <p className="text-xs text-gray-500">Status ao vivo do caminho do provedor até o cliente.</p>
            <div className="mt-4 overflow-x-auto">
              <svg width="680" height="160" viewBox="0 0 680 160" className="min-w-[680px]">
                <rect x="20" y="50" width="120" height="56" rx="16" fill="#e0f2fe" />
                <text x="80" y="83" textAnchor="middle" fontSize="12" fill="#0369a1">Provedor</text>

                <rect x="170" y="30" width="140" height="96" rx="18" fill="#e2e8f0" />
                <text x="240" y="78" textAnchor="middle" fontSize="12" fill="#334155">POP</text>
                <text x="240" y="96" textAnchor="middle" fontSize="10" fill="#64748b">
                  {pops.find((pop) => pop.id === selected?.popId)?.name || '—'}
                </text>

                <rect
                  x="340"
                  y="40"
                  width="140"
                  height="76"
                  rx="18"
                  fill={flowStatus === 'critical' ? '#fee2e2' : flowStatus === 'warning' ? '#fef3c7' : '#dcfce7'}
                />
                <text x="410" y="78" textAnchor="middle" fontSize="12" fill="#334155">
                  {selected?.type || 'OLT/ONT'}
                </text>
                <text x="410" y="96" textAnchor="middle" fontSize="10" fill="#64748b">
                  {selected?.serial || '—'}
                </text>

                <rect x="510" y="30" width="140" height="96" rx="18" fill="#ede9fe" />
                <text x="580" y="76" textAnchor="middle" fontSize="12" fill="#5b21b6">Cliente</text>
                <text x="580" y="94" textAnchor="middle" fontSize="10" fill="#6d28d9">
                  {selected?.clients || 0} ativo(s)
                </text>

                <line x1="140" y1="78" x2="170" y2="78" stroke="#94a3b8" strokeWidth="2" />
                <line x1="310" y1="78" x2="340" y2="78" stroke="#94a3b8" strokeWidth="2" />
                <line x1="480" y1="78" x2="510" y2="78" stroke="#94a3b8" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="panel">
            <h3 className="text-base font-semibold text-gray-900">Interfaces e alertas</h3>
            <p className="text-xs text-gray-500">Estado por interface e ONTs conectadas.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(selected?.interfaces || []).map((iface) => (
                <div key={iface.name} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{iface.name}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone[iface.status]}`}>
                      {iface.status === 'online'
                        ? 'Online'
                        : iface.status === 'warning'
                        ? 'Aviso'
                        : iface.status === 'degraded'
                        ? 'Degradado'
                        : iface.status === 'critical'
                        ? 'Crítico'
                        : 'Offline'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <ArrowTrendingDownIcon className="h-4 w-4 text-sky-500" />
                    {iface.down} Mbps
                    <ArrowTrendingUpIcon className="ml-2 h-4 w-4 text-emerald-500" />
                    {iface.up} Mbps
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ONTs conectadas: {iface.onts}
                  </div>
                </div>
              ))}
              {!selected?.interfaces?.length && (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  Nenhuma interface disponível para este equipamento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OltOnt;
