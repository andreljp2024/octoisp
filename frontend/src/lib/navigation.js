import {
  HomeIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ServerStackIcon,
  WifiIcon,
  SignalIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const navigationSections = [
  {
    title: 'Visão geral',
    items: [
      { name: 'Dashboard NOC', href: '/dashboard', icon: HomeIcon, permission: 'dashboard.view' },
      {
        name: 'Monitoramento de Rede',
        href: '/network-monitoring',
        icon: ServerStackIcon,
        permission: 'devices.view',
      },
      {
        name: 'Monitoramento de Dispositivos',
        href: '/devices',
        icon: ComputerDesktopIcon,
        permission: 'devices.view',
      },
      { name: 'OLT/ONT', href: '/olt-ont', icon: SignalIcon, permission: 'devices.view' },
      {
        name: 'Interfaces',
        href: '/interface-monitoring',
        icon: WifiIcon,
        permission: 'devices.view',
      },
    ],
  },
  {
    title: 'Operação',
    items: [
      {
        name: 'Descoberta Automática',
        href: '/discovery',
        icon: CommandLineIcon,
        permission: 'devices.discover',
      },
      { name: 'Alertas', href: '/alerts', icon: BellIcon, permission: 'alerts.view' },
      { name: 'Relatórios', href: '/reports', icon: ChartBarIcon, permission: 'reports.view' },
      {
        name: 'Ferramentas de Rede',
        href: '/tools',
        icon: CommandLineIcon,
        permission: 'tools.access',
      },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { name: 'Clientes', href: '/customers', icon: UserGroupIcon, permission: 'customers.view' },
      { name: 'POP', href: '/pops', icon: BuildingOfficeIcon, permission: 'pops.view' },
      {
        name: 'Monitoramento POP',
        href: '/pop-monitoring',
        icon: ChartBarIcon,
        permission: 'pops.view',
      },
      {
        name: 'Provedores',
        href: '/providers',
        icon: BuildingOfficeIcon,
        permission: 'providers.view',
      },
      { name: 'ACS/TR-069', href: '/acs', icon: WifiIcon, permission: 'devices.provision' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { name: 'Usuários', href: '/users', icon: UserGroupIcon, permission: 'users.manage' },
      {
        name: 'Configurações',
        href: '/settings',
        icon: Cog6ToothIcon,
        permission: 'settings.manage',
      },
    ],
  },
  {
    title: 'Suporte',
    items: [
      {
        name: 'Ajuda Integrações',
        href: '/help-integrations',
        icon: QuestionMarkCircleIcon,
        permission: 'settings.manage',
      },
      { name: 'Meu perfil', href: '/profile', icon: UserCircleIcon, permission: null },
    ],
  },
];

export const quickNavItems = [
  { name: 'Dashboard NOC', to: '/dashboard', permission: 'dashboard.view' },
  { name: 'Monitoramento de Rede', to: '/network-monitoring', permission: 'devices.view' },
  { name: 'Dispositivos', to: '/devices', permission: 'devices.view' },
  { name: 'Alertas', to: '/alerts', permission: 'alerts.view' },
];
