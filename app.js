const STORAGE_KEY = 'condoflow-data-v2';

const seedData = {
  kpis: [
    { label: 'Unidades', value: '128' },
    { label: 'Adimplência', value: '91%' },
    { label: 'Chamados abertos', value: '12' },
    { label: 'Reservas no mês', value: '34' }
  ],
  delinquency: [
    { month: 'Jan', value: 19 },
    { month: 'Fev', value: 17 },
    { month: 'Mar', value: 14 },
    { month: 'Abr', value: 12 },
    { month: 'Mai', value: 10 },
    { month: 'Jun', value: 9 }
  ],
  urgentTasks: [
    { title: 'Elevador social em revisão', status: 'Alta' },
    { title: 'Vazamento garagem B2', status: 'Média' },
    { title: 'Renovação AVCB', status: 'Alta' }
  ],
  residents: [
    { nome: 'Ana Souza', unidade: 'A-302', telefone: '(11) 98765-2201', status: 'Adimplente' },
    { nome: 'Paulo Lima', unidade: 'B-102', telefone: '(11) 98877-1100', status: 'Pendente' },
    { nome: 'Luciana Alves', unidade: 'C-804', telefone: '(11) 99661-4003', status: 'Adimplente' }
  ],
  financialSummary: [
    'Receita prevista: R$ 164.000,00',
    'Receita recebida: R$ 149.320,00',
    'Despesas do mês: R$ 95.100,00',
    'Saldo atual: R$ 54.220,00'
  ],
  bills: [
    { unidade: 'A-302', competencia: '06/2026', valor: 'R$ 1.220,00', status: 'Pago' },
    { unidade: 'B-102', competencia: '06/2026', valor: 'R$ 1.220,00', status: 'Atrasado' },
    { unidade: 'C-804', competencia: '06/2026', valor: 'R$ 1.220,00', status: 'Pago' }
  ],
  maintenance: [
    { item: 'Troca de lâmpadas - Torre A', status: 'Concluído' },
    { item: 'Pintura da quadra', status: 'Em andamento' },
    { item: 'Inspeção bomba d\'água', status: 'Pendente' }
  ],
  bookings: [
    { item: 'Salão de festas - 15/06', status: 'Confirmado' },
    { item: 'Churrasqueira - 21/06', status: 'Confirmado' },
    { item: 'Quadra - 23/06', status: 'Aguardando pagamento' }
  ],
  notices: [
    { item: 'Assembleia ordinária em 20/06', status: 'Enviado' },
    { item: 'Interdição parcial da garagem', status: 'Enviado' },
    { item: 'Campanha de coleta seletiva', status: 'Rascunho' }
  ]
};

const sectionMeta = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do condomínio' },
  moradores: { title: 'Moradores', subtitle: 'Cadastro e situação das unidades' },
  financeiro: { title: 'Financeiro', subtitle: 'Cobranças, recebimentos e saldos' },
  manutencao: { title: 'Manutenção', subtitle: 'Solicitações e cronograma de serviços' },
  reservas: { title: 'Reservas', subtitle: 'Controle das áreas comuns' },
  comunicados: { title: 'Comunicados', subtitle: 'Mensagens e avisos para moradores' }
};

const state = {
  activeSection: 'dashboard',
  searchQuery: '',
  data: loadData()
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedData);

    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(seedData),
      ...parsed,
      residents: Array.isArray(parsed.residents) ? parsed.residents : structuredClone(seedData.residents)
    };
  } catch {
    return structuredClone(seedData);
  }
}

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function statusClass(status) {
  if (/atrasado|alta|pendente|rascunho/i.test(status)) return 'status-alert';
  if (/andamento|média|aguardando/i.test(status)) return 'status-pending';
  return 'status-ok';
}

function buildStatusTag(text) {
  const template = document.getElementById('statusTagTemplate');
  const tag = template.content.firstElementChild.cloneNode(true);
  tag.classList.add(statusClass(text));
  tag.textContent = text;
  return tag;
}

function createSafeCell(value) {
  const td = document.createElement('td');
  td.textContent = value;
  return td;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function computedKPIs() {
  const residentCount = state.data.residents.length;
  const paidCount = state.data.bills.filter((bill) => bill.status.toLowerCase() === 'pago').length;
  const rate = Math.round((paidCount / state.data.bills.length) * 100);

  return [
    { label: 'Moradores cadastrados', value: String(residentCount) },
    { label: 'Adimplência (boletos)', value: `${Number.isNaN(rate) ? 0 : rate}%` },
    { label: 'Chamados abertos', value: String(state.data.maintenance.length) },
    { label: 'Reservas no mês', value: String(state.data.bookings.length) }
  ];
}

function renderKPIs() {
  document.getElementById('kpiCards').innerHTML = computedKPIs()
    .map((kpi) => `<article class="card"><p>${kpi.label}</p><strong>${kpi.value}</strong></article>`)
    .join('');
}

function renderChart() {
  const chart = document.getElementById('chart');
  const maxValue = Math.max(...state.data.delinquency.map((item) => item.value));

  chart.innerHTML = state.data.delinquency
    .map((item) => {
      const height = Math.max(24, Math.round((item.value / maxValue) * 190));
      return `<div class="bar" style="height:${height}px" title="${item.value}%"><span>${item.month}</span></div>`;
    })
    .join('');
}

function renderSimpleList(target, items) {
  const container = document.getElementById(target);
  container.innerHTML = '';
  items.forEach((entry) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = entry.item ?? entry.title;
    li.appendChild(label);
    li.appendChild(buildStatusTag(entry.status));
    container.appendChild(li);
  });
}

function filteredResidents() {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) return state.data.residents;

  return state.data.residents.filter(
    (resident) =>
      resident.nome.toLowerCase().includes(query) ||
      resident.unidade.toLowerCase().includes(query) ||
      resident.telefone.toLowerCase().includes(query)
  );
}

function renderResidents() {
  const rows = document.getElementById('residentRows');
  rows.innerHTML = '';

  filteredResidents().forEach((resident) => {
    const tr = document.createElement('tr');
    tr.appendChild(createSafeCell(resident.nome));
    tr.appendChild(createSafeCell(resident.unidade));
    tr.appendChild(createSafeCell(resident.telefone));

    const statusTd = document.createElement('td');
    statusTd.appendChild(buildStatusTag(resident.status));
    tr.appendChild(statusTd);

    rows.appendChild(tr);
  });
}

function renderFinancial() {
  document.getElementById('financialSummary').innerHTML = state.data.financialSummary
    .map((line) => `<li><span>${line}</span></li>`)
    .join('');

  const billRows = document.getElementById('billRows');
  billRows.innerHTML = '';

  state.data.bills.forEach((bill) => {
    const tr = document.createElement('tr');
    tr.appendChild(createSafeCell(bill.unidade));
    tr.appendChild(createSafeCell(bill.competencia));
    tr.appendChild(createSafeCell(bill.valor));

    const statusTd = document.createElement('td');
    statusTd.appendChild(buildStatusTag(bill.status));
    tr.appendChild(statusTd);

    billRows.appendChild(tr);
  });
}

function render() {
  renderKPIs();
  renderChart();
  renderSimpleList('urgentTasks', state.data.urgentTasks);
  renderResidents();
  renderFinancial();
  renderSimpleList('maintenanceList', state.data.maintenance);
  renderSimpleList('bookingList', state.data.bookings);
  renderSimpleList('noticeList', state.data.notices);
}

function setSection(section) {
  state.activeSection = section;

  document.querySelectorAll('.section').forEach((node) => {
    node.classList.toggle('active', node.id === section);
  });

  document.querySelectorAll('.menu__item').forEach((button) => {
    button.classList.toggle('active', button.dataset.section === section);
  });

  const meta = sectionMeta[section];
  document.getElementById('title').textContent = meta.title;
  document.getElementById('subtitle').textContent = meta.subtitle;
}

function setupListeners() {
  document.querySelectorAll('.menu__item').forEach((button) => {
    button.addEventListener('click', () => setSection(button.dataset.section));
  });

  document.getElementById('residentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    state.data.residents.unshift({
      nome: String(formData.get('nome')).trim(),
      unidade: String(formData.get('unidade')).trim().toUpperCase(),
      telefone: String(formData.get('telefone')).trim(),
      status: 'Pendente'
    });

    persistData();
    event.currentTarget.reset();
    render();
    showToast('Morador adicionado com sucesso.');
  });

  document.getElementById('newAction').addEventListener('click', () => {
    const actions = {
      dashboard: 'Novo indicador criado com sucesso.',
      moradores: 'Convite para novo morador preparado.',
      financeiro: 'Remessa de boletos preparada.',
      manutencao: 'Novo chamado de manutenção aberto.',
      reservas: 'Agenda de áreas comuns aberta.',
      comunicados: 'Rascunho de comunicado criado.'
    };

    showToast(actions[state.activeSection]);
  });

  document.getElementById('search').addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderResidents();
  });

  document.getElementById('resetDemo').addEventListener('click', () => {
    state.data = structuredClone(seedData);
    state.searchQuery = '';
    document.getElementById('search').value = '';
    persistData();
    render();
    showToast('Dados de demonstração restaurados.');
  });
}

render();
setupListeners();
