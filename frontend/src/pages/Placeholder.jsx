import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

function Placeholder({ title, description }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <WrenchScrewdriverIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {description || 'Esta seção está em construção no ambiente de demonstração.'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <div className="rounded-md border border-gray-200 px-4 py-3">
            Dados reais serão integrados via API.
          </div>
          <div className="rounded-md border border-gray-200 px-4 py-3">
            Alguns recursos estão desativados no modo preview.
          </div>
          <div className="rounded-md border border-gray-200 px-4 py-3">
            Acesso liberado por perfil e permissões.
          </div>
          <div className="rounded-md border border-gray-200 px-4 py-3">
            Navegação e layout já estão prontos.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Placeholder;
