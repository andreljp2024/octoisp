import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircleIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: 'acesso', label: 'Acesso' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'infra', label: 'Banco & Filas' },
  { id: 'dominio', label: 'Domínio & TLS' },
  { id: 'resumo', label: 'Resumo & Deploy' },
];

const SetupWizard = () => {
  const [step, setStep] = useState(0);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState({ enabled: false, configured: false });
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [form, setForm] = useState({
    domain: '',
    frontendUrl: '',
    allowedOrigins: '',
    integrationAllowlist: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseJwtSecret: '',
    databaseUrl: '',
    metricsDbUrl: '',
    redisUrl: '',
    grafanaUrl: '',
    tr069ServiceUrl: '',
    tlsCert: '',
    tlsKey: '',
    tlsMode: 'letsencrypt',
    letsencryptEmail: '',
    letsencryptDomains: '',
    allowSimulation: false,
  });

  useEffect(() => {
    if (form.domain && !form.letsencryptDomains) {
      setForm((prev) => ({ ...prev, letsencryptDomains: form.domain }));
    }
  }, [form.domain]);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(token);
    if (step === 1)
      return form.supabaseUrl && form.supabaseAnonKey && form.supabaseJwtSecret;
    if (step === 2) return form.databaseUrl && form.metricsDbUrl && form.redisUrl;
    if (step === 3) {
      if (form.tlsMode === 'letsencrypt') {
        return (
          form.frontendUrl &&
          form.allowedOrigins &&
          form.letsencryptEmail &&
          form.letsencryptDomains
        );
      }
      if (form.tlsMode === 'selfsigned') {
        return form.frontendUrl && form.allowedOrigins;
      }
      return form.frontendUrl && form.allowedOrigins && form.tlsCert && form.tlsKey;
    }
    return true;
  }, [step, token, form]);

  const callSetup = async (endpoint, payload) => {
    const response = await fetch(`/api/setup/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-setup-token': token,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Falha na operação.');
    }
    return response.json();
  };

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => null);
  }, []);

  const handleTest = async (label, url) => {
    if (!url) {
      toast.error('Informe a URL para testar.');
      return;
    }
    try {
      const data = await callSetup('test-connection', { url });
      if (data.ok) {
        toast.success(`${label} OK • ${data.latencyMs}ms`);
      } else {
        toast.error(`${label} retornou status ${data.status}`);
      }
    } catch (error) {
      toast.error(`Falha ao testar ${label}.`);
    }
  };

  const handleConfigure = async () => {
    setLoading(true);
    try {
      await callSetup('configure', {
        ...form,
        tlsCert: form.tlsMode === 'manual' ? form.tlsCert : '',
        tlsKey: form.tlsMode === 'manual' ? form.tlsKey : '',
        letsencryptEnabled: form.tlsMode === 'letsencrypt',
        letsencryptEmail: form.letsencryptEmail,
        letsencryptDomains: form.letsencryptDomains,
      });
      toast.success('Configurações aplicadas.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await callSetup('deploy', {});
      toast.success('Deploy iniciado.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeploying(false);
    }
  };

  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleValidate = async () => {
    setConnectionStatus(null);
    try {
      const data = await callSetup('validate', {
        databaseUrl: form.databaseUrl,
        metricsDbUrl: form.metricsDbUrl,
        redisUrl: form.redisUrl,
        supabaseUrl: form.supabaseUrl,
      });
      setConnectionStatus(data);
      toast.success('Validação concluída.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const [logs, setLogs] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [deploySteps, setDeploySteps] = useState([]);

  const handleDeployStream = () => {
    setLogs([]);
    setDeploySteps([]);
    setStreaming(true);
    const url = `/api/setup/deploy-stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);
    eventSource.addEventListener('log', (event) => {
      setLogs((prev) => [...prev, event.data]);
    });
    eventSource.addEventListener('step', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setDeploySteps((prev) => {
          const existingIndex = prev.findIndex((item) => item.name === payload.name);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], ...payload };
            return next;
          }
          return [...prev, payload];
        });
      } catch (error) {
        setLogs((prev) => [...prev, event.data]);
      }
    });
    eventSource.addEventListener('error', (event) => {
      setLogs((prev) => [...prev, event.data || 'Erro no deploy.']);
    });
    eventSource.addEventListener('done', (event) => {
      setLogs((prev) => [...prev, `Deploy finalizado (code ${event.data})`]);
      eventSource.close();
      setStreaming(false);
    });
    eventSource.onerror = () => {
      setLogs((prev) => [...prev, 'Erro no stream de deploy.']);
      eventSource.close();
      setStreaming(false);
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Assistente de Implantação OctoISP
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Configure Supabase, banco, domínio e faça o deploy sem editar arquivos.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-600">
              {status.enabled ? 'Assistente ativo' : 'Assistente desativado'}
            </div>
          </div>
          {!status.enabled && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Para usar este assistente, habilite `SETUP_WIZARD_ENABLED=true` e
              defina `SETUP_WIZARD_TOKEN`.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {steps.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  index === step
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {index + 1}. {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Token do assistente</label>
                  <input
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Supabase URL</label>
                  <input
                    value={form.supabaseUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, supabaseUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleTest('Supabase', form.supabaseUrl)}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    Testar
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={form.supabaseAnonKey}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, supabaseAnonKey: event.target.value }))
                    }
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Supabase JWT Secret</label>
                  <input
                    type="password"
                    value={form.supabaseJwtSecret}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, supabaseJwtSecret: event.target.value }))
                    }
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">DATABASE_URL</label>
                  <input
                    value={form.databaseUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, databaseUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">METRICS_DB_URL</label>
                  <input
                    value={form.metricsDbUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, metricsDbUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">REDIS_URL</label>
                  <input
                    value={form.redisUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, redisUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">GRAFANA_URL</label>
                  <input
                    value={form.grafanaUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, grafanaUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleValidate}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    Validar conexões
                  </button>
                  {connectionStatus && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className={`rounded-full px-2 py-1 ${connectionStatus.supabase.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        Supabase {connectionStatus.supabase.ok ? 'OK' : 'Falha'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${connectionStatus.database.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        DB {connectionStatus.database.ok ? 'OK' : 'Falha'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${connectionStatus.metrics.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        Metrics {connectionStatus.metrics.ok ? 'OK' : 'Falha'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${connectionStatus.redis.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        Redis {connectionStatus.redis.ok ? 'OK' : 'Falha'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Domínio</label>
                  <input
                    value={form.domain}
                    onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Frontend URL</label>
                  <input
                    value={form.frontendUrl}
                    onChange={(event) => setForm((prev) => ({ ...prev, frontendUrl: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Allowed Origins</label>
                  <input
                    value={form.allowedOrigins}
                    onChange={(event) => setForm((prev) => ({ ...prev, allowedOrigins: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Allowlist de integração</label>
                  <input
                    value={form.integrationAllowlist}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, integrationAllowlist: event.target.value }))
                    }
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-sm font-medium text-gray-700">Certificado TLS</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'letsencrypt', label: 'Let’s Encrypt (automático)' },
                      { id: 'selfsigned', label: 'Auto assinado (automático)' },
                      { id: 'manual', label: 'Manual' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, tlsMode: option.id }))}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                          form.tlsMode === option.id
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.tlsMode === 'letsencrypt' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        E-mail (Let’s Encrypt)
                      </label>
                      <input
                        value={form.letsencryptEmail}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, letsencryptEmail: event.target.value }))
                        }
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Domínios (separados por vírgula)
                      </label>
                      <input
                        value={form.letsencryptDomains}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, letsencryptDomains: event.target.value }))
                        }
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 text-xs text-amber-600">
                      Let’s Encrypt requer domínio público apontado para este servidor e `SETUP_HOST_DIR` configurado no host.
                    </div>
                  </>
                )}
                {form.tlsMode === 'selfsigned' && (
                  <div className="md:col-span-2 text-xs text-amber-600">
                    Certificado auto assinado. Use apenas em ambientes internos ou staging.
                  </div>
                )}
                {form.tlsMode === 'manual' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        TLS Fullchain (PEM)
                      </label>
                      <textarea
                        rows={4}
                        value={form.tlsCert}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tlsCert: event.target.value }))
                        }
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        TLS Private Key (PEM)
                      </label>
                      <textarea
                        rows={4}
                        value={form.tlsKey}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tlsKey: event.target.value }))
                        }
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Revise as configurações e clique em aplicar. Em seguida execute o deploy.
                </div>
                <button
                  type="button"
                  onClick={handleConfigure}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {loading ? 'Aplicando...' : 'Aplicar configuração'}
                </button>
                <button
                  type="button"
                  onClick={handleDeployStream}
                  disabled={streaming}
                  className="ml-3 inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  {streaming ? 'Implantando...' : 'Iniciar deploy (tempo real)'}
                </button>
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="ml-3 inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  {deploying ? 'Implantando...' : 'Deploy rápido'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
              disabled={!canNext}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
          {logs.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-emerald-200">
              <pre className="whitespace-pre-wrap">{logs.join('\n')}</pre>
            </div>
          )}
          {deploySteps.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Progresso do deploy</p>
              <div className="mt-3 space-y-2 text-sm">
                {deploySteps.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-slate-700">{item.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === 'done'
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'done'
                        ? 'Concluído'
                        : item.status === 'error'
                        ? 'Falhou'
                        : 'Executando'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
