import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function Modal({ open, title, onClose, children, actions, widthClass = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${widthClass} rounded-2xl border border-slate-200 bg-white p-6 shadow-xl`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <span className="sr-only">Fechar</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {actions ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
