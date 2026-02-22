const helpCatalog = {
  '/dashboard': {
    title: 'Dashboard NOC',
    summary: 'Visão geral em tempo real da operação, alertas e tráfego agregado.',
    sections: [
      {
        title: 'O que acompanhar',
        items: [
          'Dispositivos online/offline e tendência de disponibilidade.',
          'Alertas críticos nas últimas horas.',
          'Tráfego semanal e mudanças bruscas de consumo.'
        ]
      },
      {
        title: 'Fluxo sugerido',
        items: [
          'Revise alertas críticos e abra a tela de alertas.',
          'Valide dispositivos offline e acione ações corretivas.',
          'Confira o tráfego agregado para identificar gargalos.'
        ]
      }
    ],
    checklist: [
      { id: 'dashboard-alerts', label: 'Verifique alertas críticos ativos' },
      { id: 'dashboard-devices', label: 'Confirme dispositivos offline' },
      { id: 'dashboard-traffic', label: 'Analise o tráfego semanal' }
    ],
    actions: [
      { label: 'Abrir Alertas', description: 'Lista completa de incidentes', href: '/alerts' },
      { label: 'Ver Dispositivos', description: 'Inventário e status', href: '/devices' },
      { label: 'Monitoramento de Rede', description: 'Latência e saúde do backbone', href: '/network-monitoring' }
    ]
  },
  '/network-monitoring': {
    title: 'Monitoramento de Rede',
    summary: 'Health do backbone, POPs e latência média com atualização automática.',
    sections: [
      {
        title: 'Configurações-chave',
        items: [
          'Selecione a janela de tempo para análise (1h a 30d).',
          'Defina o auto-refresh para visões de NOC.',
          'Se admin global, filtre o provedor antes de agir.'
        ]
      },
      {
        title: 'Boas práticas',
        items: [
          'Use exportação CSV para auditoria e SLA.',
          'Investigue POPs em estado degradado.',
          'Cruze incidentes críticos com latência elevada.'
        ]
      }
    ],
    checklist: [
      { id: 'network-range', label: 'Confirmar janela de análise correta' },
      { id: 'network-pop', label: 'Revisar POPs com status degradado' },
      { id: 'network-export', label: 'Exportar relatório quando necessário' }
    ],
    actions: [
      { label: 'Monitoramento POP', description: 'Detalhe por POP', href: '/pop-monitoring' },
      { label: 'Relatórios', description: 'Exportações e agendamentos', href: '/reports' }
    ]
  },
  '/interface-monitoring': {
    title: 'Monitoramento de Interfaces',
    summary: 'Acompanhe tráfego, utilização e erros por interface de cada equipamento.',
    sections: [
      {
        title: 'Como usar',
        items: [
          'Escolha Provedor, POP, Equipamento e Interface.',
          'Observe download, upload e erros em tempo real.',
          'Use a atualização para validar intervenções.'
        ]
      }
    ],
    checklist: [
      { id: 'iface-select', label: 'Selecionar POP e interface correta' },
      { id: 'iface-traffic', label: 'Validar tráfego e utilização' }
    ],
    actions: [
      { label: 'Ver Dispositivos', description: 'Ir para inventário', href: '/devices' },
      { label: 'Monitoramento POP', description: 'Visão por POP', href: '/pop-monitoring' }
    ]
  },
  '/devices': {
    title: 'Dispositivos',
    summary: 'Inventário completo e ações de cadastro, edição e status.',
    sections: [
      {
        title: 'Ações frequentes',
        items: [
          'Cadastrar novo equipamento com IP e modelo.',
          'Atualizar status e localização.',
          'Excluir equipamentos descomissionados.'
        ]
      }
    ],
    checklist: [
      { id: 'devices-add', label: 'Cadastrar novos CPE/ONT' },
      { id: 'devices-status', label: 'Revisar dispositivos offline' }
    ],
    actions: [
      { label: 'Monitoramento de Rede', description: 'Saúde geral da rede', href: '/network-monitoring' },
      { label: 'Ferramentas de Rede', description: 'Diagnósticos remotos', href: '/tools' }
    ]
  },
  '/customers': {
    title: 'Clientes',
    summary: 'Gestão de contratos, planos e status financeiro.',
    sections: [
      {
        title: 'Checklist diário',
        items: [
          'Identificar clientes inadimplentes.',
          'Atualizar planos e contatos.',
          'Validar dispositivos vinculados.'
        ]
      }
    ],
    checklist: [
      { id: 'customers-status', label: 'Revisar inadimplência' },
      { id: 'customers-plan', label: 'Atualizar planos críticos' }
    ],
    actions: [
      { label: 'Dispositivos', description: 'Ver equipamentos do cliente', href: '/devices' }
    ]
  },
  '/alerts': {
    title: 'Alertas',
    summary: 'Central de incidentes com priorização e resolução.',
    sections: [
      {
        title: 'Resolução',
        items: [
          'Reconheça alertas críticos para iniciar resposta.',
          'Marque como resolvido ao concluir.',
          'Use filtros para reduzir ruído.'
        ]
      }
    ],
    checklist: [
      { id: 'alerts-ack', label: 'Reconhecer alertas críticos' },
      { id: 'alerts-resolve', label: 'Encerrar alertas resolvidos' }
    ],
    actions: [
      { label: 'Configurações', description: 'Regras de notificação', href: '/settings' }
    ]
  },
  '/reports': {
    title: 'Relatórios',
    summary: 'Geração e agendamento de relatórios de SLA, tráfego e incidentes.',
    sections: [
      {
        title: 'Como usar',
        items: [
          'Gere PDF/CSV sob demanda.',
          'Agende relatórios recorrentes.',
          'Verifique datas e formatos.'
        ]
      }
    ],
    checklist: [
      { id: 'reports-export', label: 'Gerar relatório mensal de SLA' },
      { id: 'reports-schedule', label: 'Agendar exportações recorrentes' }
    ],
    actions: [
      { label: 'Monitoramento de Rede', description: 'Dados de origem', href: '/network-monitoring' }
    ]
  },
  '/pops': {
    title: 'POPs',
    summary: 'Gestão dos pontos de presença e capacidade instalada.',
    sections: [
      {
        title: 'Boas práticas',
        items: [
          'Atualize capacidade de uplink.',
          'Revise localidade e status.',
          'Vincule equipamentos ao POP correto.'
        ]
      }
    ],
    checklist: [
      { id: 'pops-capacity', label: 'Conferir uplinks críticos' }
    ],
    actions: [
      { label: 'Monitoramento POP', description: 'Tráfego em tempo real', href: '/pop-monitoring' }
    ]
  },
  '/pop-monitoring': {
    title: 'Monitoramento POP',
    summary: 'Tráfego, latência e alertas por POP em tempo real.',
    sections: [
      {
        title: 'Passos rápidos',
        items: [
          'Selecione provedor e POP.',
          'Acompanhe download, upload e perda.',
          'Revise alertas ativos do POP.'
        ]
      }
    ],
    checklist: [
      { id: 'pop-status', label: 'Validar status do POP selecionado' },
      { id: 'pop-alerts', label: 'Checar alertas do POP' }
    ]
  },
  '/providers': {
    title: 'Provedores',
    summary: 'Gestão multi-tenant, planos e SLA.',
    sections: [
      {
        title: 'Governança',
        items: [
          'Ajuste plano e SLA conforme contrato.',
          'Monitore status de provedores pendentes.',
          'Garanta isolamento de dados.'
        ]
      }
    ],
    checklist: [
      { id: 'providers-sla', label: 'Confirmar metas de SLA' }
    ]
  },
  '/acs': {
    title: 'ACS/TR-069',
    summary: 'Provisionamento e execução remota de parâmetros em CPE/ONT.',
    sections: [
      {
        title: 'Recomendações',
        items: [
          'Use templates versionados por fabricante.',
          'Agende comandos em horários de menor impacto.',
          'Revise logs de execução.'
        ]
      }
    ],
    checklist: [
      { id: 'acs-templates', label: 'Revisar templates de provisionamento' }
    ]
  },
  '/discovery': {
    title: 'Descoberta Automática',
    summary: 'Identificação automática de dispositivos e onboarding.',
    sections: [
      {
        title: 'Uso sugerido',
        items: [
          'Defina ranges e credenciais de varredura.',
          'Valide fingerprinting de fabricantes.',
          'Promova dispositivos para inventário.'
        ]
      }
    ],
    checklist: [
      { id: 'discovery-scan', label: 'Executar varredura programada' }
    ]
  },
  '/tools': {
    title: 'Ferramentas de Rede',
    summary: 'Diagnósticos úteis para NOC com histórico por POP/cliente.',
    sections: [
      {
        title: 'Execução remota',
        items: [
          'Selecione CPE/ONT para associar o diagnóstico.',
          'Salve evidências para auditoria.',
          'Compare resultados anteriores no histórico.'
        ]
      }
    ],
    checklist: [
      { id: 'tools-run', label: 'Executar teste em dispositivo crítico' },
      { id: 'tools-history', label: 'Verificar histórico do POP' }
    ]
  },
  '/users': {
    title: 'Usuários',
    summary: 'Perfis, permissões e acesso operacional.',
    sections: [
      {
        title: 'Governança',
        items: [
          'Atribua papéis de acordo com a função.',
          'Revise status de usuários suspensos.',
          'Mantenha dados de contato atualizados.'
        ]
      }
    ],
    checklist: [
      { id: 'users-review', label: 'Revisar permissões críticas' }
    ]
  },
  '/settings': {
    title: 'Configurações',
    summary: 'Parâmetros globais de operação, alertas e integrações.',
    sections: [
      {
        title: 'Checklist',
        items: [
          'Confirme dados do Supabase e integrações.',
          'Ajuste política de alertas e retenção.',
          'Valide preferências de interface.'
        ]
      }
    ],
    checklist: [
      { id: 'settings-notify', label: 'Testar notificação de alertas' },
      { id: 'settings-theme', label: 'Aplicar tema e preferências' }
    ],
    actions: [
      { label: 'Guia de Integrações', description: 'Como integrar POPs e APIs', href: '/help-integrations' }
    ]
  },
  '/help-integrations': {
    title: 'Ajuda de Integração',
    summary: 'Passo a passo para integrar POPs, APIs e equipamentos no OctoISP.',
    sections: [
      {
        title: 'Pontos-chave',
        items: [
          'Cadastre o POP com capacidade e uplink.',
          'Integre APIs via Gateway ou Webhook.',
          'Configure SNMP/TR-069 para coleta.'
        ]
      }
    ],
    checklist: [
      { id: 'help-pop', label: 'POP cadastrado e validado' },
      { id: 'help-api', label: 'API do POP integrada' },
      { id: 'help-snmp', label: 'SNMP/TR-069 configurado' }
    ],
    actions: [
      { label: 'Configurações', description: 'Integrações e parâmetros globais', href: '/settings' },
      { label: 'Monitoramento de Interfaces', description: 'Ver métricas por interface', href: '/interface-monitoring' }
    ]
  },
  '/profile': {
    title: 'Meu perfil',
    summary: 'Atualize dados pessoais e preferências do operador.',
    sections: [
      {
        title: 'Recomendações',
        items: [
          'Mantenha telefone e e-mail atualizados.',
          'Configure avatar para identificação rápida.',
          'Revise fuso horário.'
        ]
      }
    ],
    checklist: [
      { id: 'profile-update', label: 'Atualizar contatos' }
    ]
  }
};

const defaultHelp = {
  title: 'Ajuda OctoISP',
  summary: 'Selecione um módulo no menu para ver dicas específicas.',
  sections: [
    {
      title: 'Atalhos rápidos',
      items: [
        'Use o menu lateral para navegar entre módulos.',
        'Ative o tema escuro nas Configurações.',
        'Utilize as Ferramentas de Rede para diagnóstico.'
      ]
    }
  ],
  checklist: [],
  actions: [
    { label: 'Dashboard', description: 'Visão geral da operação', href: '/dashboard' }
  ]
};

export const resolveHelpContent = (pathname) => {
  const cleanPath = pathname.split('?')[0];
  if (helpCatalog[cleanPath]) {
    return helpCatalog[cleanPath];
  }

  const matched = Object.keys(helpCatalog).find((key) =>
    key !== '/' && cleanPath.startsWith(key)
  );
  return matched ? helpCatalog[matched] : defaultHelp;
};

export const helpCatalogEntries = helpCatalog;
