import React from 'react';
import { NavLink } from 'react-router-dom';
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
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard NOC', href: '/dashboard', icon: HomeIcon, permission: 'dashboard.view' },
  { name: 'Monitoramento de Rede', href: '/network-monitoring', icon: ServerStackIcon, permission: 'devices.view' },
  { name: 'Monitoramento de Dispositivos', href: '/devices', icon: ComputerDesktopIcon, permission: 'devices.view' },
  { name: 'OLT/ONT', href: '/olt-ont', icon: SignalIcon, permission: 'devices.view' },
  { name: 'Interfaces', href: '/interface-monitoring', icon: WifiIcon, permission: 'devices.view' },
  { name: 'Descoberta Automática', href: '/discovery', icon: CommandLineIcon, permission: 'devices.discover' },
  { name: 'Clientes', href: '/customers', icon: UserGroupIcon, permission: 'customers.view' },
  { name: 'POP', href: '/pops', icon: BuildingOfficeIcon, permission: 'pops.view' },
  { name: 'Monitoramento POP', href: '/pop-monitoring', icon: ChartBarIcon, permission: 'pops.view' },
  { name: 'Provedores', href: '/providers', icon: BuildingOfficeIcon, permission: 'providers.view' },
  { name: 'ACS/TR-069', href: '/acs', icon: WifiIcon, permission: 'devices.provision' },
  { name: 'Alertas', href: '/alerts', icon: BellIcon, permission: 'alerts.view' },
  { name: 'Relatórios', href: '/reports', icon: ChartBarIcon, permission: 'reports.view' },
  { name: 'Ferramentas de Rede', href: '/tools', icon: CommandLineIcon, permission: 'tools.access' },
  { name: 'Usuários', href: '/users', icon: UserGroupIcon, permission: 'users.manage' },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon, permission: 'settings.manage' },
  { name: 'Ajuda Integrações', href: '/help-integrations', icon: QuestionMarkCircleIcon, permission: 'settings.manage' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Sidebar({ isOpen, onClose, hasPermission, collapsed, onToggleCollapse }) {
  return (
    <>
      {/* Menu fora da tela para mobile */}
      <div className={`fixed inset-0 z-40 flex ${isOpen ? '' : 'hidden'}`}>
        {/* Fundo escuro */}
        <div 
          className="fixed inset-0 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </div>

        {/* Barra lateral */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white/95 border-r border-slate-200 shadow-xl ${isOpen ? '' : '-ml-full'} transition-all ease-in-out duration-300`}>
          <div className="absolute top-0 right-0 -ml-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Fechar barra lateral</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-bold">
                  OI
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">OctoISP</h1>
                  <p className="text-xs text-slate-500">NOC Platform</p>
                </div>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation
                .filter(item => hasPermission(item.permission))
                .map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      classNames(
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md transition',
                        isActive
                          ? 'bg-sky-100 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={classNames(
                            'mr-4 h-6 w-6',
                            isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-500'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Barra lateral estática para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col ${collapsed ? 'w-20' : 'w-64'} border-r border-slate-200 bg-white/90 backdrop-blur transition-all duration-200`}>
          <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-bold">
                  OI
                </div>
                <div className={collapsed ? 'hidden' : ''}>
                  <h1 className="text-lg font-bold text-slate-900">OctoISP</h1>
                  <p className="text-xs text-slate-500">NOC Platform</p>
                </div>
              </div>
            </div>
            <div className={`mt-4 flex ${collapsed ? 'justify-center' : 'justify-end'} px-4`}>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                {collapsed ? '>>' : '<<'}
              </button>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation
                .filter(item => hasPermission(item.permission))
                .map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      classNames(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition',
                        isActive
                          ? 'bg-sky-100 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={classNames(
                            'mr-3 h-6 w-6',
                            isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-500'
                          )}
                          aria-hidden="true"
                        />
                        <span className={collapsed ? 'sr-only' : ''}>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
