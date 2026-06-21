import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useBranding } from '../lib/branding';
import { navigationSections } from '../lib/navigation';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function NavItem({ item, collapsed, onNavigate, mobile }) {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/dashboard'}
      title={collapsed ? item.name : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        classNames(
          'group flex items-center rounded-xl px-3 py-2.5 transition-all duration-150',
          mobile ? 'text-base font-medium' : 'text-sm font-medium',
          isActive
            ? 'bg-sky-100 text-sky-800 shadow-sm ring-1 ring-sky-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={classNames(
              'h-5 w-5 flex-shrink-0',
              mobile ? 'mr-3' : collapsed ? 'mx-auto' : 'mr-3',
              isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-500'
            )}
            aria-hidden="true"
          />
          <span className={collapsed && !mobile ? 'sr-only' : ''}>{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function Sidebar({
  isOpen,
  onClose,
  hasPermission,
  collapsed,
  onToggleCollapse,
  userProfile,
  onHelp,
  onLogout,
}) {
  const branding = useBranding();
  const location = useLocation();

  React.useEffect(() => {
    if (isOpen) {
      onClose?.();
    }
  }, [isOpen, onClose, location.pathname, location.search, location.hash]);

  return (
    <>
      <div className={`fixed inset-0 z-40 lg:hidden ${isOpen ? '' : 'hidden'}`}>
        <button
          type="button"
          aria-label="Fechar barra lateral"
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <aside className="relative flex h-full w-full max-w-sm flex-col border-r border-slate-200 bg-white/95 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logomarca"
                  className="h-10 w-10 rounded-xl border border-slate-200 object-contain bg-white"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                  OI
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900">{branding.name}</h1>
                <p className="text-xs text-slate-500">NOC Platform</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="sr-only">Fechar barra lateral</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {navigationSections.map((section) => {
              const visibleItems = section.items.filter((item) =>
                item.permission ? hasPermission(item.permission) : true
              );

              if (!visibleItems.length) return null;

              return (
                <section key={section.title} className="mb-5">
                  <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <NavItem
                        key={item.href}
                        item={item}
                        mobile
                        onNavigate={onClose}
                        collapsed={false}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="border-t border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <img
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200"
                src={userProfile?.avatarUrl}
                alt=""
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {userProfile?.name || 'Operador'}
                </p>
                <p className="truncate text-xs text-slate-500">{userProfile?.email}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <NavLink
                to="/profile"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <UserCircleIcon className="h-4 w-4" />
                Perfil
              </NavLink>
              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  classNames(
                    'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
                    hasPermission('settings.manage')
                      ? isActive
                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      : 'pointer-events-none border-slate-100 text-slate-300'
                  )
                }
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Ajustes
              </NavLink>
              <button
                type="button"
                onClick={onHelp}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
                Ajuda
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </aside>
      </div>

      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div
          className={classNames(
            'flex flex-col border-r border-slate-200 bg-white/90 backdrop-blur transition-all duration-200',
            collapsed ? 'w-20' : 'w-72'
          )}
        >
          <div className="flex h-0 flex-1 flex-col overflow-y-auto py-5">
            <div className={classNames('flex items-center px-4', collapsed ? 'justify-center' : '')}>
              <div className="flex items-center gap-3">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logomarca"
                    className="h-10 w-10 rounded-xl border border-slate-200 object-contain bg-white"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                    OI
                  </div>
                )}
                {!collapsed ? (
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">{branding.name}</h1>
                    <p className="text-xs text-slate-500">NOC Platform</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex justify-end px-4">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                {collapsed ? (
                  <ChevronDoubleRightIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <nav className="mt-4 flex-1 px-3">
              {navigationSections.map((section) => {
                const visibleItems = section.items.filter((item) =>
                  item.permission ? hasPermission(item.permission) : true
                );

                if (!visibleItems.length) return null;

                return (
                  <section key={section.title} className="mb-5">
                    {!collapsed ? (
                      <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {section.title}
                      </div>
                    ) : (
                      <div className="px-3 pb-2">
                        <div className="h-px bg-slate-200" />
                      </div>
                    )}

                    <div className="space-y-1">
                      {visibleItems.map((item) => (
                        <NavItem
                          key={item.href}
                          item={item}
                          collapsed={collapsed}
                          onNavigate={undefined}
                          mobile={false}
                        />
                      ))}
                    </div>
                  </section>
              );
            })}
            </nav>

            <div className="mt-4 border-t border-slate-200 px-4 pt-4">
              <div className={classNames('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
                <img
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200"
                  src={userProfile?.avatarUrl}
                  alt=""
                />
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {userProfile?.name || 'Operador'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{userProfile?.email}</p>
                  </div>
                ) : null}
              </div>

              {!collapsed ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <NavLink
                    to="/profile"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    Perfil
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      classNames(
                        'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
                        hasPermission('settings.manage')
                          ? isActive
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          : 'pointer-events-none border-slate-100 text-slate-300'
                      )
                    }
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Ajustes
                  </NavLink>
                  <button
                    type="button"
                    onClick={onHelp}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    Ajuda
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-2">
                  <NavLink
                    to="/profile"
                    title="Perfil"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserCircleIcon className="h-4 w-4" />
                  </NavLink>
                  <NavLink
                    to="/settings"
                    title="Ajustes"
                    className={({ isActive }) =>
                      classNames(
                        'inline-flex h-9 w-9 items-center justify-center rounded-full border text-slate-600 transition',
                        hasPermission('settings.manage')
                          ? isActive
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                          : 'pointer-events-none border-slate-100 text-slate-300'
                      )
                    }
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </NavLink>
                  <button
                    type="button"
                    title="Ajuda"
                    onClick={onHelp}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Sair"
                    onClick={onLogout}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

NavItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    permission: PropTypes.string,
  }).isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
  mobile: PropTypes.bool,
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hasPermission: PropTypes.func.isRequired,
  collapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  userProfile: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
  onHelp: PropTypes.func,
  onLogout: PropTypes.func,
};
