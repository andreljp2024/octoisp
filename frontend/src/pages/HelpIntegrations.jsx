import React, { useMemo, useState } from 'react';
import {
  BuildingOfficeIcon,
  CpuChipIcon,
  WifiIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const flowNodes = [
  {
    id: 'pop',
    title: 'POP cadastrado',
    description: 'Registre POP com localização, capacidade e uplinks.',
    details:
      'Defina nome, cidade, capacidade e responsável. Vincule o POP ao provedor correto para garantir RLS e isolamento.',
    icon: BuildingOfficeIcon,
  },
  {
    id: 'equip',
    title: 'Equipamentos',
    description: 'Inclua CPE/ONT, OLT e switches com IP e modelo.',
    details:
      'Cadastre equipamentos com IP, tipo, modelo e credenciais de acesso. Organize por cliente e POP.',
    icon: CpuChipIcon,
  },
  {
    id: 'api',
    title: 'Integração API',
    description: 'Conecte APIs do POP para inventário e eventos.',
    details:
      'Integre via API Gateway ou Webhook para enviar inventário e eventos. Utilize autenticação JWT e escopo por provedor.',
    icon: ShieldCheckIcon,
  },
  {
    id: 'coleta',
    title: 'Coleta SNMP/ACS',
    description: 'Habilite polling SNMP e filas TR-069.',
    details:
      'Configure comunidade SNMP, versão e intervalos. Para CPE/ONT, habilite ACS/TR-069 com templates.',
    icon: WifiIcon,
  },
  {
    id: 'alertas',
    title: 'Alertas & SLA',
    description: 'Defina regras por POP e severidade.',
    details:
      'Configure limiares de latência, perda e uso de banda. Acione notificações por e-mail, push e Telegram.',
    icon: BoltIcon,
  },
  {
    id: 'noc',
    title: 'Painel NOC',
    description: 'Visualize tráfego e saúde em tempo real.',
    details:
      'Acompanhe dashboards, interfaces e relatórios com atualização automática e gráficos interativos.',
    icon: ChartBarIcon,
  },
];

const integrationSteps = [
  {
    title: '1) Cadastre o POP',
    text: 'Crie o POP com nome, cidade, capacidade e provedor. Defina o responsável técnico.',
  },
  {
    title: '2) Conecte APIs do POP',
    text: 'Integre inventário, topologia e eventos via API Gateway ou Webhook configurado.',
  },
  {
    title: '3) Registre equipamentos',
    text: 'Adicione CPE/ONT, OLT, switches e roteadores com IP, modelo e localização.',
  },
  {
    title: '4) Configure SNMP/ACS',
    text: 'Defina comunidade SNMP, versão, templates TR-069 e fila de comandos.',
  },
  {
    title: '5) Valide a coleta',
    text: 'Acompanhe latência, tráfego e erros por interface no monitoramento.',
  },
  {
    title: '6) Ative alertas e SLA',
    text: 'Defina regras por POP e permita notificações automáticas.',
  },
];

const checklistItems = [
  'POP com capacidade e uplink cadastrados.',
  'API do POP autenticada e testada.',
  'Equipamentos vinculados a cliente e POP.',
  'Credenciais SNMP/ACS configuradas.',
  'Métricas de latência e tráfego chegando.',
  'Alertas críticos ativos e canais definidos.',
];

const HelpIntegrations = () => {
  const [activeNode, setActiveNode] = useState(flowNodes[0]);
  const [checked, setChecked] = useState(() => ({}));

  const flow = useMemo(() => flowNodes, []);

  const toggleCheck = (item) => {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          Ajuda: Integração de POPs, APIs e Equipamentos
        </h1>
        <p className="text-sm text-slate-500">
          Guia ilustrativo para integrar APIs de cada POP e conectar equipamentos
          (CPE/ONT) ao monitoramento do OctoISP.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="panel animate-rise">
          <h2 className="text-lg font-semibold text-slate-900">Visão ilustrativa</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fluxo de dados do POP para o NOC com serviços integrados.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <svg viewBox="0 0 640 240" className="h-56 w-full">
              <defs>
                <linearGradient id="popGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect x="20" y="40" width="170" height="140" rx="18" fill="url(#popGradient)" opacity="0.15" />
              <rect x="230" y="30" width="180" height="160" rx="20" fill="#e2e8f0" />
              <rect x="450" y="55" width="160" height="110" rx="16" fill="#0ea5e9" opacity="0.12" />
              <text x="55" y="80" fontSize="14" fill="#0f172a" fontWeight="600">POP</text>
              <text x="55" y="105" fontSize="12" fill="#475569">APIs • Equipamentos</text>
              <text x="260" y="70" fontSize="14" fill="#0f172a" fontWeight="600">OctoISP</text>
              <text x="260" y="95" fontSize="12" fill="#475569">Gateway • Coleta • Alertas</text>
              <text x="470" y="90" fontSize="14" fill="#0f172a" fontWeight="600">NOC</text>
              <text x="470" y="115" fontSize="12" fill="#475569">Dashboards • SLA</text>
              <path d="M190 110 L230 110" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <path d="M410 110 L450 110" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <circle cx="210" cy="110" r="6" fill="#38bdf8" />
              <circle cx="430" cy="110" r="6" fill="#38bdf8" />
              <circle cx="90" cy="150" r="10" fill="#38bdf8" opacity="0.5" />
              <circle cx="120" cy="150" r="10" fill="#6366f1" opacity="0.5" />
              <circle cx="150" cy="150" r="10" fill="#22c55e" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="panel animate-rise">
          <h2 className="text-lg font-semibold text-slate-900">Checklist de integração</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use esta lista para garantir que cada POP esteja integrado e monitorado.
          </p>
          <div className="mt-4 space-y-3">
            {checklistItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleCheck(item)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition ${
                  checked[item]
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50'
                }`}
              >
                <span
                  className={`mt-1 h-4 w-4 rounded-full border ${
                    checked[item] ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                  }`}
                />
                <span className="text-sm text-slate-700">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel animate-rise">
        <h2 className="text-lg font-semibold text-slate-900">Fluxograma interativo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Clique em cada etapa para ver detalhes do processo de integração.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {flow.map((node, index) => {
            const Icon = node.icon;
            const isActive = activeNode?.id === node.id;
            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onClick={() => setActiveNode(node)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-sky-300 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {node.title}
                </button>
                {index < flow.length - 1 && (
                  <span className="hidden h-0.5 w-6 bg-slate-200 lg:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {activeNode && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <activeNode.icon className="h-6 w-6 text-sky-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{activeNode.title}</p>
                <p className="text-xs text-slate-500">{activeNode.description}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{activeNode.details}</p>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel animate-rise">
          <h2 className="text-lg font-semibold text-slate-900">Passo a passo</h2>
          <div className="mt-4 space-y-3">
            {integrationSteps.map((step) => (
              <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel animate-rise">
          <h2 className="text-lg font-semibold text-slate-900">Exemplo visual de conexão</h2>
          <p className="mt-1 text-sm text-slate-500">
            Equipamentos conectados ao POP com coleta SNMP e TR-069.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <svg viewBox="0 0 520 220" className="h-52 w-full">
              <rect x="30" y="40" width="150" height="140" rx="16" fill="#38bdf8" opacity="0.12" />
              <rect x="210" y="60" width="120" height="100" rx="14" fill="#22c55e" opacity="0.18" />
              <rect x="360" y="60" width="120" height="100" rx="14" fill="#f59e0b" opacity="0.18" />
              <text x="60" y="80" fontSize="12" fill="#0f172a" fontWeight="600">POP</text>
              <text x="60" y="105" fontSize="10" fill="#475569">Switch/OLT</text>
              <text x="235" y="95" fontSize="12" fill="#0f172a" fontWeight="600">CPE/ONT</text>
              <text x="380" y="95" fontSize="12" fill="#0f172a" fontWeight="600">CPE/ONT</text>
              <path d="M180 110 L210 110" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <path d="M330 110 L360 110" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <circle cx="195" cy="110" r="5" fill="#38bdf8" />
              <circle cx="345" cy="110" r="5" fill="#38bdf8" />
              <text x="80" y="160" fontSize="10" fill="#64748b">SNMP / TR-069</text>
            </svg>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Para cada equipamento, configure credenciais SNMP/TR-069 e valide a
            chegada de métricas no monitoramento de interfaces.
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpIntegrations;
