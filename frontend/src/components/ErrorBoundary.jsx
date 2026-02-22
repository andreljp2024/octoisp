import React from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Mantem o log para diagnostico sem derrubar a tela inteira.
    // eslint-disable-next-line no-console
    console.error('Erro de renderizacao capturado:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearCache = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } finally {
      window.location.reload();
    }
  };

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (!hasError) {
      return children;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Ocorreu um erro ao carregar a interface
              </h2>
              <p className="text-sm text-gray-600">
                Isso pode acontecer quando o cache do app fica desatualizado. Tente
                recarregar ou limpar o cache do aplicativo.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={this.handleClearCache}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <TrashIcon className="h-4 w-4" />
              Limpar cache
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
