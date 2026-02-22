import { supabase } from './supabaseClient';

export const apiFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao acessar API.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const apiGet = (url, options = {}) => apiFetch(url, { ...options, method: 'GET' });
export const apiPost = (url, body, options = {}) =>
  apiFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) });
export const apiPut = (url, body, options = {}) =>
  apiFetch(url, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (url, options = {}) =>
  apiFetch(url, { ...options, method: 'DELETE' });
