const axios = require('axios');
const moment = require('moment');
const express = require('express');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATION !== 'true') {
  // eslint-disable-next-line no-console
  console.error(
    'SNMP Monitor em modo simulado. Defina ALLOW_SIMULATION=true apenas para testes.'
  );
  process.exit(1);
}

/**
 * Simulação de monitoramento SNMP para dispositivos de rede
 * Este script demonstra como o serviço SNMP do OctoISP
 * pode monitorar dispositivos com base em perfis de polling
 */

class SNMPPoller {
  constructor(config) {
    this.config = config;
    this.devices = [];
    this.pollingProfiles = [];
  }

  /**
   * Carrega perfis de polling para diferentes tipos de dispositivos
   */
  async loadPollingProfiles() {
    this.pollingProfiles = [
      {
        id: 'profile-core-router',
        name: 'Roteador de Core',
        priority: 'critical',
        pollInterval: 60, // segundos
        metrics: [
          'ifOperStatus',
          'ifHCInOctets',
          'ifHCOutOctets',
          'ifInErrors',
          'ifOutErrors',
          'hrProcessorLoad',
          'hrSystemMemTotal',
          'hrSystemMemFree'
        ],
        thresholds: {
          cpu: { warning: 70, critical: 85 },
          memory: { warning: 80, critical: 90 },
          errorRate: { warning: 0.01, critical: 0.1 }
        }
      },
      {
        id: 'profile-access-switch',
        name: 'Switch de Acesso',
        priority: 'high',
        pollInterval: 300, // segundos
        metrics: [
          'ifOperStatus',
          'ifHCInOctets',
          'ifHCOutOctets',
          'ifInErrors',
          'ifOutErrors',
          'dot1dTpFdbAddress'
        ],
        thresholds: {
          errorRate: { warning: 0.01, critical: 0.1 },
          fdbSize: { warning: 4000, critical: 8000 }
        }
      },
      {
        id: 'profile-cpe',
        name: 'Dispositivo CPE',
        priority: 'medium',
        pollInterval: 600, // segundos
        metrics: [
          'ifOperStatus',
          'ifHCInOctets',
          'ifHCOutOctets',
          'sysUpTime',
          'entPhySensorValue'
        ],
        thresholds: {
          uptime: { warning: 300, critical: 60 } // segundos
        }
      }
    ];
    
    console.log('Perfis de polling SNMP carregados com sucesso');
  }

  /**
   * Carrega lista de dispositivos para monitoramento
   */
  async loadDevices() {
    // Simulando carregamento de dispositivos do banco de dados
    this.devices = [
      {
        id: 'device-core-01',
        ip: '10.0.1.1',
        community: 'public',
        version: '2c',
        vendor: 'Cisco',
        model: 'ISR 4451',
        profile: 'profile-core-router',
        providerId: 'provider-1',
        popId: 'pop-central',
        customerId: null,
        lastContact: null,
        status: 'active'
      },
      {
        id: 'device-access-01',
        ip: '10.10.1.10',
        community: 'public',
        version: '2c',
        vendor: 'MikroTik',
        model: 'CCR2004',
        profile: 'profile-access-switch',
        providerId: 'provider-1',
        popId: 'pop-central',
        customerId: 'customer-1001',
        lastContact: null,
        status: 'active'
      },
      {
        id: 'device-cpe-001',
        ip: '192.168.100.100',
        community: 'public',
        version: '2c',
        vendor: 'Huawei',
        model: 'HG658',
        profile: 'profile-cpe',
        providerId: 'provider-1',
        popId: 'pop-central',
        customerId: 'customer-1001',
        lastContact: null,
        status: 'active'
      }
    ];
    
    console.log(`${this.devices.length} dispositivos carregados para monitoramento`);
  }

  /**
   * Simula a obtenção de dados SNMP de um dispositivo
   */
  async pollDevice(device) {
    console.log(`Realizando polling SNMP no dispositivo: ${device.id} (${device.ip})`);
    
    try {
      // Obter perfil de polling para este dispositivo
      const profile = this.pollingProfiles.find(p => p.id === device.profile);
      if (!profile) {
        throw new Error(`Perfil de polling não encontrado para o dispositivo ${device.id}`);
      }
      
      // Simula obtenção de dados SNMP
      const snmpData = await this.simulateSNMPQuery(device, profile.metrics);
      
      // Processa os dados e verifica limiares
      const processedData = this.processSNMPData(snmpData, profile.thresholds);
      
      // Registra os dados no sistema de métricas
      await this.storeMetrics(device, processedData);
      
      // Verifica alertas
      await this.checkAlerts(device, processedData, profile.thresholds);
      
      // Atualiza status do dispositivo
      device.lastContact = new Date().toISOString();
      device.status = 'online';
      
      return {
        success: true,
        deviceId: device.id,
        data: processedData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erro no polling do dispositivo ${device.id}:`, error.message);
      
      // Atualiza status do dispositivo
      device.status = 'offline';
      
      // Registra evento de falha
      await this.recordFailure(device, error.message);
      
      return {
        success: false,
        deviceId: device.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simula consulta SNMP
   */
  async simulateSNMPQuery(device, metrics) {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Retorna dados simulados com base no tipo de dispositivo
    const data = {};
    
    for (const metric of metrics) {
      switch (metric) {
        case 'ifOperStatus':
          // Simula status de interfaces
          data[metric] = {
            '1': 'up',
            '2': Math.random() > 0.9 ? 'down' : 'up', // 10% de chance de estar down
            '3': 'up',
            '4': 'up'
          };
          break;
          
        case 'ifHCInOctets':
          // Simula bytes recebidos (em Mbps)
          data[metric] = {
            '1': Math.floor(Math.random() * 1000000000), // 0-1G
            '2': Math.floor(Math.random() * 500000000),  // 0-500M
            '3': Math.floor(Math.random() * 100000000),  // 0-100M
            '4': Math.floor(Math.random() * 50000000)    // 0-50M
          };
          break;
          
        case 'ifHCOutOctets':
          // Simula bytes transmitidos (em Mbps)
          data[metric] = {
            '1': Math.floor(Math.random() * 500000000),  // 0-500M
            '2': Math.floor(Math.random() * 300000000),  // 0-300M
            '3': Math.floor(Math.random() * 100000000),  // 0-100M
            '4': Math.floor(Math.random() * 50000000)    // 0-50M
          };
          break;
          
        case 'ifInErrors':
          data[metric] = {
            '1': Math.floor(Math.random() * 10),
            '2': Math.floor(Math.random() * 50), // Mais erros na interface secundária
            '3': Math.floor(Math.random() * 5),
            '4': Math.floor(Math.random() * 2)
          };
          break;
          
        case 'ifOutErrors':
          data[metric] = {
            '1': Math.floor(Math.random() * 5),
            '2': Math.floor(Math.random() * 10),
            '3': Math.floor(Math.random() * 2),
            '4': Math.floor(Math.random() * 1)
          };
          break;
          
        case 'hrProcessorLoad':
          // Simula carga de CPU
          data[metric] = Math.floor(Math.random() * 100);
          break;
          
        case 'hrSystemMemTotal':
          // Simula memória total (em KB)
          data[metric] = 4194304; // 4GB
          break;
          
        case 'hrSystemMemFree':
          // Simula memória livre (em KB)
          const totalMem = data['hrSystemMemTotal'] || 4194304;
          const usedPercentage = Math.random() * 0.9; // 0-90% usado
          data[metric] = totalMem * (1 - usedPercentage);
          break;
          
        case 'sysUpTime':
          // Simula uptime (em centésimos de segundo)
          data[metric] = Math.floor(Math.random() * 30) * 8640000; // 0-30 dias
          break;
          
        case 'entPhySensorValue':
          // Simula temperatura (em décimos de Celsius)
          data[metric] = Math.floor(250 + Math.random() * 400); // 25-65°C
          break;
          
        default:
          data[metric] = Math.floor(Math.random() * 100);
      }
    }
    
    return data;
  }

  /**
   * Processa dados SNMP e calcula métricas derivadas
   */
  processSNMPData(rawData, thresholds) {
    const processed = { ...rawData };
    
    // Calcula uso de CPU percentual
    if (rawData.hrProcessorLoad !== undefined) {
      processed.cpuUsage = rawData.hrProcessorLoad;
    }
    
    // Calcula uso de memória percentual
    if (rawData.hrSystemMemTotal && rawData.hrSystemMemFree) {
      const total = rawData.hrSystemMemTotal;
      const free = rawData.hrSystemMemFree;
      const used = total - free;
      processed.memoryUsage = Math.round((used / total) * 100);
    }
    
    // Calcula taxas de erro
    if (rawData.ifInOctets && rawData.ifInErrors) {
      const interfaces = Object.keys(rawData.ifInOctets);
      processed.errorRates = {};
      
      interfaces.forEach(ifIndex => {
        const octets = rawData.ifInOctets[ifIndex] || 1;
        const errors = rawData.ifInErrors[ifIndex] || 0;
        processed.errorRates[`in_${ifIndex}`] = (errors / octets) * 100;
      });
    }
    
    // Calcula throughput
    if (rawData.ifHCInOctets && rawData.ifHCOutOctets) {
      const interfaces = Object.keys(rawData.ifHCInOctets);
      processed.throughput = {};
      
      interfaces.forEach(ifIndex => {
        // Converter bytes para Mbps
        processed.throughput[`in_${ifIndex}`] = Math.round((rawData.ifHCInOctets[ifIndex] * 8) / 1000000);
        processed.throughput[`out_${ifIndex}`] = Math.round((rawData.ifHCOutOctets[ifIndex] * 8) / 1000000);
      });
    }
    
    return processed;
  }

  /**
   * Armazena métricas no sistema de séries temporais
   */
  async storeMetrics(device, metrics) {
    // Simula envio de métricas para o banco de dados de séries temporais
    console.log(`Armazenando ${Object.keys(metrics).length} métricas para o dispositivo ${device.id}`);
    
    // Na implementação real, enviaria para o banco de dados de séries temporais
    // como InfluxDB ou TimescaleDB
    
    // Exemplo de estrutura que seria armazenada:
    const metricsBatch = [];
    
    // Converter métricas para formato de série temporal
    for (const [metricName, metricValue] of Object.entries(metrics)) {
      if (typeof metricValue === 'object') {
        // Se for um objeto (como dados por interface), adicionar cada valor individualmente
        for (const [subKey, subValue] of Object.entries(metricValue)) {
          metricsBatch.push({
            measurement: metricName,
            tags: {
              device_id: device.id,
              device_ip: device.ip,
              interface: subKey,
              provider_id: device.providerId
            },
            fields: { value: subValue },
            timestamp: new Date().toISOString()
          });
        }
      } else {
        metricsBatch.push({
          measurement: metricName,
          tags: {
            device_id: device.id,
            device_ip: device.ip,
            provider_id: device.providerId
          },
          fields: { value: metricValue },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log(`Enviando ${metricsBatch.length} pontos de métrica para o TSDB...`);
    
    // Simula envio ao banco de dados de séries temporais
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Verifica limiares e gera alertas conforme necessário
   */
  async checkAlerts(device, metrics, thresholds) {
    const alerts = [];
    
    // Verificar limiares de CPU
    if (metrics.cpuUsage !== undefined && thresholds.cpu) {
      if (metrics.cpuUsage >= thresholds.cpu.critical) {
        alerts.push({
          type: 'high_cpu',
          severity: 'critical',
          title: 'Alta utilização de CPU',
          description: `CPU do dispositivo ${device.id} está em ${metrics.cpuUsage}%`,
          metric: 'cpuUsage',
          value: metrics.cpuUsage,
          threshold: thresholds.cpu.critical
        });
      } else if (metrics.cpuUsage >= thresholds.cpu.warning) {
        alerts.push({
          type: 'high_cpu',
          severity: 'warning',
          title: 'Utilização de CPU elevada',
          description: `CPU do dispositivo ${device.id} está em ${metrics.cpuUsage}%`,
          metric: 'cpuUsage',
          value: metrics.cpuUsage,
          threshold: thresholds.cpu.warning
        });
      }
    }
    
    // Verificar limiares de memória
    if (metrics.memoryUsage !== undefined && thresholds.memory) {
      if (metrics.memoryUsage >= thresholds.memory.critical) {
        alerts.push({
          type: 'high_memory',
          severity: 'critical',
          title: 'Alta utilização de memória',
          description: `Memória do dispositivo ${device.id} está em ${metrics.memoryUsage}%`,
          metric: 'memoryUsage',
          value: metrics.memoryUsage,
          threshold: thresholds.memory.critical
        });
      } else if (metrics.memoryUsage >= thresholds.memory.warning) {
        alerts.push({
          type: 'high_memory',
          severity: 'warning',
          title: 'Utilização de memória elevada',
          description: `Memória do dispositivo ${device.id} está em ${metrics.memoryUsage}%`,
          metric: 'memoryUsage',
          value: metrics.memoryUsage,
          threshold: thresholds.memory.warning
        });
      }
    }
    
    // Verificar status de interfaces
    if (metrics.ifOperStatus) {
      for (const [interfaceId, status] of Object.entries(metrics.ifOperStatus)) {
        if (status === 'down') {
          alerts.push({
            type: 'interface_down',
            severity: 'critical',
            title: `Interface ${interfaceId} está inativa`,
            description: `A interface ${interfaceId} do dispositivo ${device.id} está inativa`,
            metric: 'ifOperStatus',
            value: status,
            interface: interfaceId
          });
        }
      }
    }
    
    // Verificar taxas de erro
    if (metrics.errorRates && thresholds.errorRate) {
      for (const [interfaceId, errorRate] of Object.entries(metrics.errorRates)) {
        if (errorRate >= thresholds.errorRate.critical) {
          alerts.push({
            type: 'high_error_rate',
            severity: 'critical',
            title: `Taxa de erro crítica na interface ${interfaceId}`,
            description: `Taxa de erro na interface ${interfaceId} do dispositivo ${device.id} está em ${errorRate}%`,
            metric: 'errorRate',
            value: errorRate,
            threshold: thresholds.errorRate.critical,
            interface: interfaceId
          });
        } else if (errorRate >= thresholds.errorRate.warning) {
          alerts.push({
            type: 'high_error_rate',
            severity: 'warning',
            title: `Taxa de erro elevada na interface ${interfaceId}`,
            description: `Taxa de erro na interface ${interfaceId} do dispositivo ${device.id} está em ${errorRate}%`,
            metric: 'errorRate',
            value: errorRate,
            threshold: thresholds.errorRate.warning,
            interface: interfaceId
          });
        }
      }
    }
    
    // Enviar alertas para o serviço de alertas
    if (alerts.length > 0) {
      console.log(`Detectados ${alerts.length} eventos que requerem alerta para o dispositivo ${device.id}`);
      await this.sendAlerts(device, alerts);
    }
  }

  /**
   * Envia alertas para o serviço de alertas
   */
  async sendAlerts(device, alerts) {
    for (const alert of alerts) {
      console.log(`Gerando alerta: ${alert.title} (Severidade: ${alert.severity})`);
      
      // Simula envio ao serviço de alertas
      // Na implementação real, faria uma chamada API para o serviço de alertas
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Registra falha de polling
   */
  async recordFailure(device, errorMessage) {
    console.log(`Registrando falha de polling para ${device.id}: ${errorMessage}`);
    
    // Na implementação real, registraria no banco de dados de eventos
  }

  /**
   * Executa ciclo completo de polling
   */
  async runPollingCycle() {
    console.log('Iniciando ciclo de polling SNMP...\n');
    
    // Carrega perfis e dispositivos
    await this.loadPollingProfiles();
    await this.loadDevices();
    
    // Realiza polling em cada dispositivo
    for (const device of this.devices) {
      console.log('\n' + '='.repeat(60));
      const result = await this.pollDevice(device);
      console.log(`Resultado do polling: ${result.success ? 'SUCESSO' : 'FALHA'}`);
      console.log('='.repeat(60) + '\n');
      
      // Pequeno delay entre dispositivos para não sobrecarregar a rede
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Ciclo de polling SNMP concluído!');
  }
}

// Create Express app for HTTP server
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'snmp-monitor', timestamp: new Date().toISOString() });
});

// Get devices endpoint
app.get('/devices', (req, res) => {
  const poller = new SNMPPoller({});
  res.json({
    devices: poller.devices || [],
    total: (poller.devices || []).length
  });
});

// Trigger polling cycle endpoint
app.post('/poll', async (req, res) => {
  const poller = new SNMPPoller({
    batchSize: parseInt(process.env.SNMP_BATCH_SIZE) || 5,
    timeout: parseInt(process.env.SNMP_TIMEOUT) || 5000
  });
  
  try {
    await poller.loadPollingProfiles();
    await poller.loadDevices();
    res.json({ success: true, message: 'Polling cycle completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start HTTP server
if (require.main === module) {
  // Start the HTTP server
  app.listen(PORT, () => {
    console.log(`SNMP Monitor HTTP server listening on port ${PORT}`);
    
    // Also run the initial polling cycle
    const poller = new SNMPPoller({
      batchSize: parseInt(process.env.SNMP_BATCH_SIZE) || 5,
      timeout: parseInt(process.env.SNMP_TIMEOUT) || 5000
    });
    
    poller.runPollingCycle()
      .then(() => console.log('Initial polling cycle completed'))
      .catch(console.error);
  });
}

module.exports = { SNMPPoller, app };
