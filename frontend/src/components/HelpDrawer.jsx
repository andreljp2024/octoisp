import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { resolveHelpContent } from '../lib/helpContent';

const storageKey = (path) => `octoisp.helpChecklist.${path}`;

const HelpDrawer = ({ open, onClose }) => {
  const location = useLocation();
  const content = useMemo(
    () => resolveHelpContent(location.pathname),
    [location.pathname]
  );
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const key = storageKey(location.pathname);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setChecked(JSON.parse(stored));
        return;
      } catch (error) {
        setChecked({});
      }
    }
    setChecked({});
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const toggleChecklist = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    window.localStorage.setItem(storageKey(location.pathname), JSON.stringify(next));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Ajuda</p>
            <h2 className="text-xl font-semibold text-slate-900">{content.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{content.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {content.sections?.map((section) => (
            <div key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {section.items?.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {content.checklist?.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Checklist operacional</h3>
              <div className="mt-3 space-y-3">
                {content.checklist.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="flex w-full items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                        checked[item.id]
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {content.actions?.length ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Ações rápidas</h3>
              <div className="mt-3 space-y-3">
                {content.actions.map((action) => (
                  <NavLink
                    key={action.label}
                    to={action.href}
                    onClick={onClose}
                    className="block rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.description}</p>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-6 text-xs text-slate-400">
          Dica: use o checklist para manter o fluxo operacional em dia.
        </div>
      </aside>
    </div>
  );
};

export default HelpDrawer;
