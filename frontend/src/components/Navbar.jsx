import React from 'react';
import { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, MoonIcon, SunIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { NavLink, useLocation } from 'react-router-dom';
import { UserContext } from '../App';
import { useBranding } from '../lib/branding';
import { quickNavItems } from '../lib/navigation';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Navbar({ onMenuClick, onLogout, onHelp, hasPermission }) {
  const location = useLocation();
  const branding = useBranding();
  const { userProfile } = useContext(UserContext);
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  React.useEffect(() => {
    if (location.pathname === '/login') {
      return;
    }
  }, [location.pathname]);

  const visibleQuickNavItems = quickNavItems.filter((item) =>
    item.permission ? (hasPermission ? hasPermission(item.permission) : true) : true
  );

  const handleToggleTheme = () => setIsDark((prev) => !prev);

  return (
    <Disclosure as="nav" className="bg-white/95 backdrop-blur border-b border-slate-200">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={onMenuClick}
                  className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 lg:hidden"
                >
                  <span className="sr-only">Abrir menu lateral</span>
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
                <div className="flex-shrink-0 flex items-center">
                  <div className="flex items-center gap-3">
                    {branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt="Logomarca"
                        className="h-8 w-8 rounded-lg border border-slate-200 object-contain bg-white"
                      />
                    ) : null}
                    <span className="text-slate-900 text-xl font-bold">{branding.name}</span>
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {visibleQuickNavItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        end={item.to === '/dashboard'}
                        className={({ isActive }) =>
                          classNames(
                            'px-3 py-2 rounded-md text-sm font-medium transition',
                            isActive
                              ? 'bg-sky-100 text-sky-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          )
                        }
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleToggleTheme}
                    className="mr-2 inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="sr-only">Alternar tema</span>
                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={onHelp}
                    className="mr-2 inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="sr-only">Abrir ajuda</span>
                    <QuestionMarkCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <span className="sr-only">Ver notificações</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  {/* Perfil do usuário dropdown */}
                  <Menu as="div" className="ml-3 relative">
                    <div>
                    <Menu.Button className="flex text-sm rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <span className="sr-only">Abrir menu do usuário</span>
                        <img className="h-8 w-8 rounded-md" src={userProfile.avatarUrl} alt="" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <NavLink
                                to={item.href}
                                className={classNames(
                                  active ? 'bg-slate-50' : '',
                                  'block px-4 py-2 text-sm text-slate-700'
                                )}
                              >
                                {item.name}
                              </NavLink>
                            )}
                          </Menu.Item>
                        ))}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={onLogout}
                              className={classNames(
                                active ? 'bg-slate-50' : '',
                                'block w-full px-4 py-2 text-left text-sm text-slate-700'
                              )}
                            >
                              Sair
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {visibleQuickNavItems.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={NavLink}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    classNames(
                      'block rounded-md px-3 py-2 text-base font-medium',
                      isActive
                        ? 'bg-sky-100 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )
                  }
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-slate-200 pb-3 pt-4">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <img className="h-10 w-10 rounded-md" src={userProfile.avatarUrl} alt="" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-900">{userProfile.name}</div>
                  <div className="text-sm font-medium text-slate-500">{userProfile.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onHelp}
                  className="ml-auto flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <QuestionMarkCircleIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 px-2 space-y-1">
                {userNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.name}
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={onLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  Sair
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onHelp: PropTypes.func.isRequired,
  hasPermission: PropTypes.func,
};
