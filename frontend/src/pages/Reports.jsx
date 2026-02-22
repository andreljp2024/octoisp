import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentArrowDownIcon,
  ChartBarSquareIcon,
  ClockIcon,
  CalendarDaysIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost } from '../lib/api';

const reportCards = [
  {
    title: 'SLA por POP',
    description: 'Disponibilidade e incidentes por ponto de presença.',
    frequency: 'Mensal',
    icon: ChartBarSquareIcon,
  },
  {
    title: 'Uso de Banda',
    description: 'Pico, média e variação diária de tráfego.',
    frequency: 'Semanal',
    icon: ClockIcon,
  },
  {
    title: 'Histórico de Alertas',
    description: 'Alertas críticos e tempo de resolução.',
    frequency: 'Diário',
    icon: CalendarDaysIcon,
  },
];

const scheduledReportsSeed = [
  { id: 'rep-01', name: 'SLA POP Centro', next: '2026-02-28 08:00', format: 'PDF' },
  { id: 'rep-02', name: 'Uso de Banda NOC', next: '2026-02-22 07:30', format: 'CSV' },
  { id: 'rep-03', name: 'Alertas Críticos', next: '2026-02-21 06:00', format: 'PDF' },
];

const Reports = () => {
  const { t } = useTranslation();
  const [scheduledReports, setScheduledReports] = useState(scheduledReportsSeed);
  const [availableReports, setAvailableReports] = useState(reportCards);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    next: '',
    format: 'PDF',
    type: 'devices',
  });

  const handleCreate = async () => {
    if (!form.name || !form.next || !form.type) {
      toast.error('Preencha nome e data.');
      return;
    }
    try {
      const created = await apiPost('/api/reports/schedules', form);
      setScheduledReports((prev) => [{ ...form, ...created }, ...prev]);
      setModalOpen(false);
      setForm({ name: '', next: '', format: 'PDF', type: 'devices' });
      toast.success('Relatório agendado.');
    } catch (error) {
      toast.error('Falha ao agendar relatório.');
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Excluir ${report.name}?`)) return;
    try {
      await apiDelete(`/api/reports/schedules/${report.id}`);
      setScheduledReports((prev) => prev.filter((item) => item.id !== report.id));
      toast.success('Relatório excluído.');
    } catch (error) {
      toast.error('Falha ao excluir relatório.');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('pt-BR');
  };

  const downloadReport = async (type, format = 'PDF') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, format })
      });
      if (!response.ok) {
        throw new Error('Falha no download.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `octoisp-${type}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Relatório ${format} gerado.`);
    } catch (error) {
      toast.error('Falha ao gerar relatório.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [data, schedules] = await Promise.all([
          apiGet('/api/reports'),
          apiGet('/api/reports/schedules')
        ]);
        const mapped = (data.reports || []).map((report, index) => ({
          title: report.name,
          description: report.description,
          frequency: report.frequency || 'Sob demanda',
          type: report.type,
          icon: reportCards[index % reportCards.length].icon
        }));
        setAvailableReports(mapped.length ? mapped : reportCards);
        setScheduledReports(schedules.schedules || scheduledReportsSeed);
      } catch (error) {
        setAvailableReports(reportCards);
        setScheduledReports(scheduledReportsSeed);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      {loading && (
        <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow">
          Carregando relatórios...
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('reports.title', 'Relatórios')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('reports.description', 'Gere relatórios operacionais e financeiros.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo relatório
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {availableReports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.title} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{report.title}</h2>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Frequência: {report.frequency || 'Sob demanda'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadReport(report.type || 'devices', 'PDF')}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Gerar PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport(report.type || 'devices', 'CSV')}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Gerar CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Relatórios agendados</h2>
          <p className="mt-1 text-sm text-gray-500">Execuções automáticas programadas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Relatório
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Próxima execução
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Formato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {scheduledReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{report.type || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(report.next)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{report.format}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => toast('Detalhes em construção.')}
                      className="text-sky-600 hover:text-sky-700"
                    >
                      Detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(report)}
                      className="ml-4 inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agendar relatório"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Nome do relatório</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Próxima execução</label>
            <input
              value={form.next}
              onChange={(event) => setForm((prev) => ({ ...prev, next: event.target.value }))}
              placeholder="YYYY-MM-DD HH:MM"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Formato</label>
            <select
              value={form.format}
              onChange={(event) => setForm((prev) => ({ ...prev, format: event.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            >
              <option>PDF</option>
              <option>CSV</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
            >
              <option value="devices">Dispositivos</option>
              <option value="customers">Clientes</option>
              <option value="alerts">Alertas</option>
              <option value="metrics">Métricas</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Agendar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
