const axios = require('axios');
const moment = require('moment');
const express = require('express');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATION !== 'true') {
  // eslint-disable-next-line no-console
  console.error(
    'Alert Service em modo simulado. Defina ALLOW_SIMULATION=true apenas para testes.'
  );
  process.exit(1);
}

/**
 * Simulação de sistema de alertas para a plataforma OctoISP
 * Este script demonstra como o serviço de alertas do OctoISP
 * pode gerenciar alertas com base em regras e notificar stakeholders
 */

class AlertManager {
  constructor(config) {
    this.config = config;
    this.alerts = [];
    this.rules = [];
    this.notifications = [];
  }

  /**
   * Carrega regras de alerta configuradas
   */
  async loadAlertRules() {
    this.rules = [
      {
        id: 'rule-high-cpu',
        name: 'Alta utilização de CPU',
        description: 'Alerta quando CPU ultrapassa limiar configurado',
        condition: {
          metric: 'cpuUsage',
          operator: '>',
          threshold: 80
        },
        severity: 'warning',
        deduplicationWindow: 300, // 5 minutos
        aggregation: 'average',
        target: ['noc-team', 'provider-admin']
      },
      {
        id: 'rule-interface-down',
        name: 'Interface inativa',
        description: 'Alerta quando interface de rede fica inativa',
        condition: {
          metric: 'ifOperStatus',
          operator: '==',
          value: 'down'
        },
        severity: 'critical',
        deduplicationWindow: 60, // 1 minuto
        aggregation: 'event',
        target: ['noc-team', 'field-technician']
      },
      {
        id: 'rule-high-error-rate',
        name: 'Taxa de erro elevada',
        description: 'Alerta quando taxa de erro de interface ultrapassa limiar',
        condition: {
          metric: 'errorRate',
          operator: '>',
          threshold: 0.1
        },
        severity: 'warning',
        deduplicationWindow: 300, // 5 minutos
        aggregation: 'average',
        target: ['noc-team']
      },
      {
        id: 'rule-device-offline',
        name: 'Dispositivo offline',
        description: 'Alerta quando dispositivo não responde a polling SNMP',
        condition: {
          event: 'polling_failed'
        },
        severity: 'critical',
        deduplicationWindow: 300, // 5 minutos
        aggregation: 'event',
        target: ['noc-team', 'provider-admin']
      },
      {
        id: 'rule-low-signal',
        name: 'Sinal óptico baixo',
        description: 'Alerta quando sinal óptico de ONT está abaixo do ideal',
        condition: {
          metric: 'opticalRxPower',
          operator: '<',
          threshold: -27
        },
        severity: 'warning',
        deduplicationWindow: 600, // 10 minutos
        aggregation: 'average',
        target: ['noc-team', 'field-technician']
      }
    ];
    
    console.log('Regras de alerta carregadas com sucesso');
  }

  /**
   * Simula recepção de métricas de dispositivos
   */
  async receiveMetrics() {
    // Simula métricas recebidas de dispositivos monitorados
    return [
      {
        deviceId: 'device-cpe-001',
        timestamp: moment().subtract(1, 'minute').toISOString(),
        metrics: {
          cpuUsage: 85,
          memoryUsage: 70,
          ifOperStatus: { '1': 'up', '2': 'down' },
          errorRate: 0.15,
          opticalRxPower: -28
        },
        providerId: 'provider-1',
        customerId: 'customer-1001'
      },
      {
        deviceId: 'device-access-01',
        timestamp: moment().subtract(2, 'minute').toISOString(),
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          ifOperStatus: { '1': 'up', '2': 'up', '3': 'up' },
          errorRate: 0.05
        },
        providerId: 'provider-1',
        customerId: 'customer-1001'
      },
      {
        deviceId: 'device-core-01',
        timestamp: moment().subtract(30, 'seconds').toISOString(),
        metrics: {
          cpuUsage: 92,
          memoryUsage: 85,
          ifOperStatus: { '1': 'up', '2': 'up' },
          errorRate: 0.2
        },
        providerId: 'provider-1',
        popId: 'pop-central'
      }
    ];
  }

  /**
   * Avalia métricas contra regras de alerta
   */
  evaluateMetricsAgainstRules(metricsList) {
    const triggeredAlerts = [];
    
    for (const deviceMetrics of metricsList) {
      for (const rule of this.rules) {
        const matchedAlerts = this.evaluateRule(deviceMetrics, rule);
        triggeredAlerts.push(...matchedAlerts);
      }
    }
    
    return triggeredAlerts;
  }

  /**
   * Avalia uma única regra contra métricas de dispositivo
   */
  evaluateRule(deviceMetrics, rule) {
    const alerts = [];
    const { metrics, deviceId, providerId, customerId, timestamp } = deviceMetrics;
    
    // Verifica condição da regra
    if (rule.condition.metric) {
      const { metric, operator, threshold, value } = rule.condition;
      
      if (metrics[metric] !== undefined) {
        // Se for um objeto de métricas (por exemplo, ifOperStatus por interface)
        if (typeof metrics[metric] === 'object') {
          for (const [subKey, subValue] of Object.entries(metrics[metric])) {
            if (this.checkCondition(subValue, operator, threshold || value)) {
              alerts.push({
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                deviceId,
                providerId,
                ...(customerId && { customerId }),
                metric: `${metric}.${subKey}`,
                value: subValue,
                threshold: threshold || value,
                severity: rule.severity,
                title: `${rule.name} - ${deviceId}`,
                description: `${rule.description} no dispositivo ${deviceId} (métrica: ${metric}.${subKey}, valor: ${subValue})`,
                timestamp: new Date().toISOString(),
                status: 'open'
              });
            }
          }
        } else {
          // Se for um valor simples
          if (this.checkCondition(metrics[metric], operator, threshold || value)) {
            alerts.push({
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              deviceId,
              providerId,
              ...(customerId && { customerId }),
              metric,
              value: metrics[metric],
              threshold: threshold || value,
              severity: rule.severity,
              title: `${rule.name} - ${deviceId}`,
              description: `${rule.description} no dispositivo ${deviceId} (métrica: ${metric}, valor: ${metrics[metric]})`,
              timestamp: new Date().toISOString(),
              status: 'open'
            });
          }
        }
      }
    } else if (rule.condition.event) {
      // Lógica para eventos (ainda não implementada completamente)
      // Seria usada para eventos como polling_failed
    }
    
    return alerts;
  }

  /**
   * Verifica se uma condição é verdadeira
   */
  checkCondition(value, operator, threshold) {
    switch (operator) {
      case '>':
        return parseFloat(value) > parseFloat(threshold);
      case '<':
        return parseFloat(value) < parseFloat(threshold);
      case '>=':
        return parseFloat(value) >= parseFloat(threshold);
      case '<=':
        return parseFloat(value) <= parseFloat(threshold);
      case '==':
        return value == threshold;  // eslint-disable-line eqeqeq
      case '===':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Aplica deduplicação de alertas
   */
  deduplicateAlerts(alerts) {
    const uniqueAlerts = [];
    const seen = new Map();
    
    for (const alert of alerts) {
      const rule = this.rules.find(r => r.id === alert.ruleId);
      const dedupeKey = `${alert.deviceId}-${alert.metric}-${alert.ruleId}`;
      const now = moment();
      
      // Verifica se já vimos um alerta semelhante recentemente
      if (seen.has(dedupeKey)) {
        const lastAlertTime = moment(seen.get(dedupeKey));
        const diffSeconds = now.diff(lastAlertTime, 'seconds');
        
        // Se estiver dentro da janela de deduplicação, ignora
        if (diffSeconds < rule.deduplicationWindow) {
          console.log(`Alerta duplicado ignorado para ${dedupeKey} (dentro da janela de ${rule.deduplicationWindow}s)`);
          continue;
        }
      }
      
      // Registra este alerta como visto
      seen.set(dedupeKey, alert.timestamp);
      uniqueAlerts.push(alert);
    }
    
    return uniqueAlerts;
  }

  /**
   * Agrega alertas semelhantes
   */
  aggregateAlerts(alerts) {
    // Agrupa alertas por regra e dispositivo
    const grouped = {};
    
    for (const alert of alerts) {
      const key = `${alert.ruleId}-${alert.deviceId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(alert);
    }
    
    const aggregated = [];
    
    for (const [key, group] of Object.entries(grouped)) {
      if (group.length > 1) {
        // Cria um alerta agregado
        const firstAlert = group[0];
        aggregated.push({
          ...firstAlert,
          id: `agg-${firstAlert.id}`,
          title: `${firstAlert.ruleName} - ${group.length} dispositivos afetados`,
          description: `${firstAlert.description} e ${group.length - 1} outros dispositivos`,
          count: group.length,
          aggregatedAlerts: group.map(a => a.id),
          isAggregated: true
        });
      } else {
        aggregated.push(...group);
      }
    }
    
    return aggregated;
  }

  /**
   * Processa e gera alertas
   */
  async processAlerts() {
    console.log('Recebendo métricas de dispositivos...');
    const metricsList = await this.receiveMetrics();
    
    console.log(`Avaliando ${metricsList.length} conjuntos de métricas contra regras de alerta...`);
    let triggeredAlerts = this.evaluateMetricsAgainstRules(metricsList);
    
    console.log(`Foram detectados ${triggeredAlerts.length} eventos que atendem às regras`);
    
    // Aplica deduplicação
    console.log('Aplicando deduplicação de alertas...');
    triggeredAlerts = this.deduplicateAlerts(triggeredAlerts);
    
    // Aplica agregação
    console.log('Aplicando agregação de alertas...');
    triggeredAlerts = this.aggregateAlerts(triggeredAlerts);
    
    console.log(`Foram gerados ${triggeredAlerts.length} alertas únicos após deduplicação e agregação`);
    
    // Salva alertas no sistema
    this.alerts.push(...triggeredAlerts);
    
    // Envia notificações
    for (const alert of triggeredAlerts) {
      await this.sendNotification(alert);
    }
    
    return triggeredAlerts;
  }

  /**
   * Envia notificação para stakeholders
   */
  async sendNotification(alert) {
    const targets = ['noc-team']; // Simples para demonstração
    
    for (const target of targets) {
      console.log(`Enviando notificação de alerta para ${target}: ${alert.title}`);
      
      // Simula diferentes canais de notificação
      switch (target) {
        case 'noc-team':
          // Notificação via Web Push
          await this.sendWebPushNotification(alert, 'noc-team');
          break;
        case 'provider-admin':
          // Notificação via e-mail
          await this.sendEmailNotification(alert, 'admin@provider.com');
          break;
        case 'field-technician':
          // Notificação via SMS ou aplicativo móvel
          await this.sendSmsNotification(alert, '+5511999999999');
          break;
        default:
          console.log(`Canal de notificação não configurado para target: ${target}`);
      }
    }
  }

  /**
   * Envia notificação via Web Push
   */
  async sendWebPushNotification(alert, target) {
    console.log(`Notificação Web Push: [${alert.severity.toUpperCase()}] ${alert.title}`);
    // Na implementação real, enviaria via serviço de notificação Web Push
  }

  /**
   * Envia notificação por e-mail
   */
  async sendEmailNotification(alert, email) {
    console.log(`E-mail enviado para ${email}: [${alert.severity.toUpperCase()}] ${alert.title}`);
    // Na implementação real, usaria um serviço de e-mail
  }

  /**
   * Envia notificação por SMS
   */
  async sendSmsNotification(alert, phoneNumber) {
    console.log(`SMS enviado para ${phoneNumber}: [${alert.severity.toUpperCase()}] ${alert.title}`);
    // Na implementação real, usaria um serviço de SMS
  }

  /**
   * Simula reconhecimento de alerta por operador
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = acknowledgedBy;
      
      console.log(`Alerta ${alertId} reconhecido por ${acknowledgedBy}`);
      return alert;
    }
    return null;
  }

  /**
   * Simula resolução de alerta
   */
  resolveAlert(alertId, resolvedBy) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = resolvedBy;
      
      console.log(`Alerta ${alertId} resolvido por ${resolvedBy}`);
      return alert;
    }
    return null;
  }

  /**
   * Executa o ciclo completo de gerenciamento de alertas
   */
  async runAlertCycle() {
    console.log('Iniciando ciclo de gerenciamento de alertas...\n');
    
    // Carrega regras
    await this.loadAlertRules();
    
    // Processa alertas
    const alerts = await this.processAlerts();
    
    console.log(`\n${alerts.length} alertas foram gerados:`);
    for (const alert of alerts) {
      console.log(`- ${alert.severity.toUpperCase()}: ${alert.title} (${alert.deviceId})`);
    }
    
    // Simula algumas ações de gerenciamento
    if (alerts.length > 0) {
      // Reconhece o primeiro alerta crítico
      const criticalAlert = alerts.find(a => a.severity === 'critical');
      if (criticalAlert) {
        this.acknowledgeAlert(criticalAlert.id, 'noc-operator-123');
      }
      
      // Resolve o primeiro alerta de baixa severidade
      const lowSeverityAlert = alerts.find(a => a.severity === 'warning');
      if (lowSeverityAlert) {
        this.resolveAlert(lowSeverityAlert.id, 'noc-operator-123');
      }
    }
    
    console.log('\nCiclo de gerenciamento de alertas concluído!');
  }
}

// Create Express app for HTTP server
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'alert-service', timestamp: new Date().toISOString() });
});

// Get all alerts endpoint
app.get('/alerts', (req, res) => {
  const alertManager = new AlertManager({});
  res.json({
    alerts: alertManager.alerts || [],
    total: (alertManager.alerts || []).length
  });
});

// Trigger alert cycle endpoint
app.post('/trigger', async (req, res) => {
  const alertManager = new AlertManager({
    pollingInterval: parseInt(process.env.ALERT_POLLING_INTERVAL) || 60000
  });
  
  try {
    await alertManager.loadAlertRules();
    const alerts = await alertManager.processAlerts();
    res.json({ success: true, alertsGenerated: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start HTTP server
if (require.main === module) {
  // Start the HTTP server
  app.listen(PORT, () => {
    console.log(`Alert service HTTP server listening on port ${PORT}`);
    
    // Also run the initial alert cycle
    const alertManager = new AlertManager({
      pollingInterval: parseInt(process.env.ALERT_POLLING_INTERVAL) || 60000
    });
    
    alertManager.runAlertCycle()
      .then(() => console.log('Initial alert cycle completed'))
      .catch(console.error);
  });
}

module.exports = { AlertManager, app };
