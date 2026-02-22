import React from 'react';
import { Fragment, useContext } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, MoonIcon, SunIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../App';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ onMenuClick, onLogout, onHelp }) {
  const userContext = useContext(UserContext);
  const userProfile = userContext?.userProfile || {
    name: 'Operador',
    email: 'operador@octoisp.local',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  };
  const [isDark, setIsDark] = React.useState(() => {
    return window.localStorage.getItem('octoisp.theme') === 'dark';
  });

  React.useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    window.localStorage.setItem('octoisp.theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  React.useEffect(() => {
    const handleThemeChange = (event) => {
      const next = Boolean(event?.detail?.dark);
      setIsDark(next);
    };
    window.addEventListener('octoisp-theme-change', handleThemeChange);
    return () => window.removeEventListener('octoisp-theme-change', handleThemeChange);
  }, []);

  const userNavigation = [
    { name: 'Meu perfil', href: '/profile' },
    { name: 'Configurações', href: '/settings' },
  ];

  const navItems = [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Dispositivos', to: '/devices' },
    { name: 'Clientes', to: '/customers' },
    { name: 'Alertas', to: '/alerts' },
  ];

  return (
    <Disclosure as="nav" className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 lg:hidden"
                    onClick={onMenuClick}
                  >
                    <span className="sr-only">Abrir menu principal</span>
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  </button>
                  <span className="hidden lg:block text-slate-900 text-xl font-bold">OctoISP</span>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navItems.map((item) => (
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
                    onClick={() => setIsDark((prev) => !prev)}
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
              {navItems.map((item) => (
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
