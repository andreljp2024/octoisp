import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Customers from './pages/Customers';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Placeholder from './pages/Placeholder';
import NetworkMonitoring from './pages/NetworkMonitoring';
import Pops from './pages/Pops';
import Providers from './pages/Providers';
import Acs from './pages/Acs';
import Tools from './pages/Tools';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Discovery from './pages/Discovery';
import PopMonitoring from './pages/PopMonitoring';
import InterfaceMonitoring from './pages/InterfaceMonitoring';
import HelpIntegrations from './pages/HelpIntegrations';
import SetupWizard from './pages/SetupWizard';
import ErrorBoundary from './components/ErrorBoundary';
import HelpDrawer from './components/HelpDrawer';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import './styles/index.css';

// Create contexts
const LanguageContext = createContext();
const UserContext = createContext();

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        // English translations will go here in subsequent changes
      }
    },
    pt: {
      translation: {
        // Portuguese translations will go here in subsequent changes
      }
    }
  },
  lng: 'pt',
  fallbackLng: 'pt',
  interpolation: {
    escapeValue: false
  }
});

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language);
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    
    // Update URL to reflect language preference
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part);
    
    if (pathParts.length > 0 && (pathParts[0] === 'en' || pathParts[0] === 'pt')) {
      pathParts[0] = lng;
      navigate(`/${pathParts.join('/')}`);
    } else {
      navigate(`/${lng}${path}`);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export { LanguageContext, LanguageProvider, UserContext };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState([]);
  const [language, setLanguage] = React.useState(i18n.language);
  const [userProfile, setUserProfile] = React.useState({
    name: 'Administrador',
    email: 'admin@octoisp.local',
    role: 'Administrador',
    phone: '+55 11 99999-0000',
    timezone: 'America/Sao_Paulo',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  });
  
  // Update language state when i18n language changes
  React.useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Mock function to check permissions - in real app this would come from auth
  const hasPermission = (permission) => {
    return userPermissions.includes(permission);
  };

  const authMode = import.meta.env.VITE_AUTH_MODE || 'demo';

  const handleLogin = React.useCallback(() => {
    if (authMode === 'demo') {
      setIsAuthenticated(true);
    }
  }, [authMode]);

  const handleLogout = React.useCallback(() => {
    if (authMode === 'supabase' && isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUserPermissions([]);
  }, [authMode]);

  const loadUserContext = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setUserPermissions(data.permissions || []);
      setUserProfile((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        role: data.roleLabel || data.role || prev.role,
        phone: data.phone || prev.phone,
        avatarUrl: data.avatarUrl || prev.avatarUrl
      }));
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  }, []);

  React.useEffect(() => {
    if (authMode === 'supabase' && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(Boolean(data?.session));
      });
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session));
      });
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, [authMode]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadUserContext();
    }
  }, [isAuthenticated, loadUserContext]);

  // Mostrar login se não autenticado
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <UserContext.Provider value={{ userProfile, setUserProfile }}>
          <LanguageProvider>
            <ErrorBoundary>
              <div className="app-shell flex h-screen overflow-hidden">
              <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                hasPermission={hasPermission}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
              />

                <div className="flex flex-col flex-1 w-0 overflow-hidden">
                  <Navbar
                    onMenuClick={() => setSidebarOpen(true)}
                    onLogout={handleLogout}
                    onHelp={() => setHelpOpen(true)}
                  />

                <main className="flex-1 relative z-0 overflow-y-auto py-8 focus:outline-none">
                  <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {hasPermission('devices.view') && (
                          <Route path="/devices" element={<Devices />} />
                        )}

                      {hasPermission('devices.view') && (
                        <Route path="/network-monitoring" element={<NetworkMonitoring />} />
                      )}

                      {hasPermission('customers.view') && (
                        <Route path="/customers" element={<Customers />} />
                      )}

                      {hasPermission('pops.view') && <Route path="/pops" element={<Pops />} />}
                      {hasPermission('pops.view') && (
                        <Route path="/pop-monitoring" element={<PopMonitoring />} />
                      )}

                        {hasPermission('providers.view') && (
                          <Route path="/providers" element={<Providers />} />
                        )}

                        {hasPermission('devices.provision') && (
                          <Route path="/acs" element={<Acs />} />
                        )}

                        {hasPermission('devices.discover') && (
                          <Route path="/discovery" element={<Discovery />} />
                        )}

                      {hasPermission('alerts.view') && <Route path="/alerts" element={<Alerts />} />}

                      {hasPermission('devices.view') && (
                        <Route path="/interface-monitoring" element={<InterfaceMonitoring />} />
                      )}

                      {hasPermission('reports.view') && (
                        <Route path="/reports" element={<Reports />} />
                      )}

                        {hasPermission('tools.access') && <Route path="/tools" element={<Tools />} />}

                        {hasPermission('users.manage') && (
                          <Route path="/users" element={<Users />} />
                        )}

                        <Route path="/profile" element={<Profile />} />

                        {hasPermission('settings.manage') && (
                        <Route path="/settings" element={<Settings />} />
                      )}

                      <Route path="/help-integrations" element={<HelpIntegrations />} />
                      <Route path="/setup" element={<SetupWizard />} />

                        <Route
                          path="*"
                          element={
                            <Placeholder
                              title="Página não encontrada"
                              description="Verifique o link ou use o menu para navegar."
                            />
                          }
                        />
                      </Routes>
                    </div>
                  </main>
                </div>
              </div>
            </ErrorBoundary>

            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
          </LanguageProvider>
        </UserContext.Provider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
