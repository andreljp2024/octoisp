import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function Login({ onLogin }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authMode = import.meta.env.VITE_AUTH_MODE || 'demo';
  const allowDemo =
    (import.meta.env.VITE_ALLOW_DEMO_LOGIN ?? 'true').toString() === 'true';
  const isDemoBlocked = authMode === 'demo' && !allowDemo;
  const isSupabaseMode = authMode === 'supabase';
  const isSupabaseBlocked = isSupabaseMode && !isSupabaseConfigured;
  const isAuthUnsupported =
    !['demo', 'supabase'].includes(authMode) || isSupabaseBlocked;

  const onSubmit = async (data) => {
    setLoading(true);
    
    // Fluxo de login (demo ou Supabase)
    try {
      if (isDemoBlocked || isAuthUnsupported) {
        throw new Error('Autenticação real não configurada.');
      }
      if (isSupabaseMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        if (error) {
          throw error;
        }
        if (onLogin) {
          onLogin();
        }
        navigate('/dashboard', { replace: true });
        return;
      }

      // Simulação de login (demo)
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (onLogin) {
        onLogin();
      }
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center">
            <LockClosedIcon className="h-8 w-8 text-sky-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesse sua conta OctoISP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Insira suas credenciais para continuar
          </p>
          {(isDemoBlocked || isAuthUnsupported) && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Autenticação real não configurada neste build. Configure Supabase Auth
              com `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` e defina
              `VITE_AUTH_MODE=supabase` + `VITE_ALLOW_DEMO_LOGIN=false` para produção.
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Endereço de e-mail
              </label>
              <input
                {...register("email", { 
                  required: "E-mail é obrigatório",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "E-mail inválido"
                  }
                })}
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.email ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm`}
                placeholder="Endereço de e-mail"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                {...register("password", { 
                  required: "Senha é obrigatória",
                  minLength: {
                    value: 6,
                    message: "A senha deve ter pelo menos 6 caracteres"
                  }
                })}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  errors.password ? "border-red-300" : "border-gray-300"
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm`}
                placeholder="Senha"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register("remember")}
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-sky-600 hover:text-sky-500">
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isDemoBlocked || isAuthUnsupported}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-sky-500 group-hover:text-sky-400" />
                </span>
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
