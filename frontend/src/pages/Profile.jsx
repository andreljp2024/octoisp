import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../App';
import { CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiGet, apiPut } from '../lib/api';

const Profile = () => {
  const { t } = useTranslation();
  const userContext = useContext(UserContext);
  const userProfile = userContext?.userProfile || {
    name: 'Operador',
    email: 'operador@octoisp.local',
    role: 'NOC',
    phone: '',
    timezone: 'America/Sao_Paulo',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  };
  const setUserProfile = userContext?.setUserProfile || (() => {});
  const [form, setForm] = useState(userProfile);
  const [loading, setLoading] = useState(true);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    try {
      await apiPut('/api/users/me', form);
      setUserProfile(form);
      toast.success('Perfil atualizado com sucesso.');
    } catch (error) {
      toast.error('Falha ao atualizar perfil.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet('/api/users/me');
        const nextProfile = {
          ...userProfile,
          name: data.name || userProfile.name,
          email: data.email || userProfile.email,
          role: data.roleLabel || data.role || userProfile.role,
          phone: data.phone || userProfile.phone,
          avatarUrl: data.avatarUrl || userProfile.avatarUrl,
        };
        setUserProfile(nextProfile);
        setForm(nextProfile);
      } catch (error) {
        setForm(userProfile);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setUserProfile]);

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando perfil...
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('profile.title', 'Meu perfil')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('profile.description', 'Atualize seus dados pessoais e preferências.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={form.avatarUrl}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm hover:bg-sky-700"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{form.name}</p>
              <p className="text-sm text-gray-500">{form.role}</p>
              <p className="text-xs text-gray-400">{form.email}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome completo</label>
              <input
                value={form.name}
                onChange={handleChange('name')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cargo</label>
              <input
                value={form.role}
                onChange={handleChange('role')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input
                value={form.email}
                onChange={handleChange('email')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fuso horário</label>
              <input
                value={form.timezone}
                onChange={handleChange('timezone')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                value={form.avatarUrl}
                onChange={handleChange('avatarUrl')}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
