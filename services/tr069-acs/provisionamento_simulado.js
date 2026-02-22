const axios = require('axios');
const fs = require('fs').promises;
const express = require('express');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATION !== 'true') {
  // eslint-disable-next-line no-console
  console.error(
    'TR-069 ACS em modo simulado. Defina ALLOW_SIMULATION=true apenas para testes.'
  );
  process.exit(1);
}

/**
 * Simulação de provisionamento TR-069 para dispositivos CPE
 * Este script demonstra como o serviço ACS TR-069 do OctoISP
 * pode provisionar dispositivos automaticamente com base em templates
 */

class TR069Provisioner {
  constructor(config) {
    this.config = config;
    this.devices = [];
    this.templates = [];
  }

  /**
   * Carrega templates de provisionamento
   */
  async loadTemplates() {
    try {
      // Simulando carregamento de templates do banco de dados
      this.templates = [
        {
          id: 'tpl-mikrotik-ros',
          name: 'Template MikroTik RouterOS',
          vendor: 'MikroTik',
          model: 'RouterBOARD',
          parameters: {
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID': 'WIFI_CLIENTE',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_BROADCOM_COM_WmmMode': 'Enabled',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase': 'senha_padrao_segura',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel': 6,
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Bandwidth': '20MHz',
            'InternetGatewayDevice.User.1.Username': 'cliente_ppp',
            'InternetGatewayDevice.User.1.Password': 'senha_ppp',
            'InternetGatewayDevice.ManagementServer.PeriodicInformEnable': true,
            'InternetGatewayDevice.ManagementServer.PeriodicInformInterval': 600
          }
        },
        {
          id: 'tpl-huawei-home',
          name: 'Template Huawei HG6xx',
          vendor: 'Huawei',
          model: 'HG6xx',
          parameters: {
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID': 'WIFI_CLIENTE',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_CT-COM_WLAN_AUTHENTICATIONTYPE': 'WPA2-PSK',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase': 'senha_padrao_segura',
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Channel': 36,
            'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_CT-COM_WlanService': 'enable',
            'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Username': 'cliente_ppp',
            'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.Password': 'senha_ppp',
            'InternetGatewayDevice.ManagementServer.PeriodicInformEnable': true,
            'InternetGatewayDevice.ManagementServer.PeriodicInformInterval': 1200
          }
        }
      ];
      
      console.log('Templates de provisionamento carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar templates:', error.message);
    }
  }

  /**
   * Detecta o tipo de dispositivo com base em informações básicas
   */
  detectDeviceType(deviceInfo) {
    const { oui, productClass, softwareVersion } = deviceInfo;
    
    // Simulando detecção por OUI (organizational unique identifier)
    if (oui.startsWith('001EC')) return 'MikroTik';
    if (oui.startsWith('0022A')) return 'MikroTik';
    if (oui.startsWith('001BC')) return 'Huawei';
    if (oui.startsWith('001DD')) return 'ZTE';
    if (oui.startsWith('086266')) return 'Ubiquiti';
    
    // Se não identificado pelo OUI, tenta identificar pelo productClass
    if (productClass.toLowerCase().includes('mikrotik')) return 'MikroTik';
    if (productClass.toLowerCase().includes('huawei')) return 'Huawei';
    if (productClass.toLowerCase().includes('zte')) return 'ZTE';
    if (productClass.toLowerCase().includes('ubnt')) return 'Ubiquiti';
    
    return 'Generic';
  }

  /**
   * Obtém template apropriado para o dispositivo
   */
  getTemplateForDevice(deviceInfo) {
    const vendor = this.detectDeviceType(deviceInfo);
    
    // Procura template específico para o vendor detectado
    const template = this.templates.find(t => 
      t.vendor.toLowerCase() === vendor.toLowerCase()
    );
    
    return template || this.templates[0]; // Retorna primeiro template como fallback
  }

  /**
   * Simula o provisionamento de um dispositivo
   */
  async provisionDevice(deviceInfo) {
    console.log(`Iniciando provisionamento do dispositivo: ${deviceInfo.serialNumber}`);
    
    // Determina o template apropriado
    const template = this.getTemplateForDevice(deviceInfo);
    console.log(`Usando template: ${template.name}`);
    
    // Atualiza parâmetros do template com informações específicas do cliente
    const finalParams = { ...template.parameters };
    
    // Personaliza SSID com base no nome do cliente ou número de série
    finalParams['InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID'] = 
      `WIFI_${deviceInfo.customerName.replace(/\s+/g, '_').toUpperCase()}`;
      
    // Personaliza credenciais PPP com base no ID do cliente
    finalParams['InternetGatewayDevice.User.1.Username'] = 
      `cliente_${deviceInfo.customerId}`;
    finalParams['InternetGatewayDevice.User.1.Password'] = 
      this.generateSecurePassword(deviceInfo.customerId);
    
    // Simula envio de comandos ao dispositivo via CWMP
    try {
      console.log('Enviando comandos de provisionamento...');
      
      // Simulando comunicação com o dispositivo TR-069
      await this.sendCommandsToDevice(deviceInfo, finalParams);
      
      // Registra o provisionamento no sistema
      await this.recordProvisioningLog(deviceInfo, template, 'success');
      
      console.log(`Dispositivo ${deviceInfo.serialNumber} provisionado com sucesso`);
      
      return {
        success: true,
        deviceId: deviceInfo.id,
        appliedTemplate: template.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Falha no provisionamento do dispositivo ${deviceInfo.serialNumber}:`, error.message);
      
      // Registra falha no sistema
      await this.recordProvisioningLog(deviceInfo, template, 'failure', error.message);
      
      return {
        success: false,
        deviceId: deviceInfo.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simula envio de comandos ao dispositivo TR-069
   */
  async sendCommandsToDevice(deviceInfo, params) {
    // Simula comunicação com o dispositivo via protocolo TR-069
    // Na implementação real, isso usaria uma pilha CWMP para enviar comandos SetParameterValues
    
    console.log(`Conectando ao dispositivo ${deviceInfo.serialNumber} via TR-069...`);
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simula envio de comandos
    const commands = Object.entries(params).map(([param, value]) => ({
      name: param,
      value: value
    }));
    
    console.log(`Enviando ${commands.length} comandos ao dispositivo...`);
    
    // Simula confirmação de execução bem-sucedida
    console.log('Comandos enviados com sucesso!');
    
    // Atualiza informações do dispositivo no sistema
    deviceInfo.lastProvisioned = new Date().toISOString();
    deviceInfo.softwareVersion = params['InternetGatewayDevice.DeviceInfo.SoftwareVersion'] || deviceInfo.softwareVersion;
    
    // Simula reboot do dispositivo se necessário
    if (params['needs_reboot']) {
      console.log('Reiniciando dispositivo após provisionamento...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3s pelo reboot
      console.log('Dispositivo reiniciado com sucesso');
    }
  }

  /**
   * Gera uma senha segura para o cliente
   */
  generateSecurePassword(customerId) {
    // Em implementação real, usaria um gerador de senhas mais robusto
    const base = `isp_${customerId}_${Date.now()}`;
    // Em implementação real, usaria crypto para gerar senha
    return base.substring(base.length - 12); // Simplificação para demonstração
  }

  /**
   * Registra o log de provisionamento
   */
  async recordProvisioningLog(deviceInfo, template, status, errorMessage = null) {
    const logEntry = {
      id: Math.random().toString(36).substr(2, 9),
      deviceId: deviceInfo.id,
      serialNumber: deviceInfo.serialNumber,
      templateUsed: template.id,
      customerId: deviceInfo.customerId,
      providerId: deviceInfo.providerId,
      status: status,
      timestamp: new Date().toISOString(),
      ...(errorMessage && { errorMessage })
    };
    
    console.log('Registrando log de provisionamento...', logEntry);
    
    // Na implementação real, salvaria no banco de dados de logs
    // ou em sistema de auditoria
  }

  /**
   * Simula descoberta automática de dispositivos
   */
  async discoverDevices(networkRange) {
    console.log(`Descobrindo dispositivos na rede: ${networkRange}`);
    
    // Simula descoberta de dispositivos na rede
    // Na implementação real, usaria técnicas como ping sweep, ARP scan, etc.
    
    const discoveredDevices = [
      {
        id: 'dev-' + Math.random().toString(36).substr(2, 9),
        serialNumber: 'MK' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        oui: '001EC' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        productClass: 'MikroTik RouterBOARD',
        softwareVersion: '6.' + Math.floor(Math.random() * 40) + '.' + Math.floor(Math.random() * 5),
        macAddress: '00:1E:C' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        ip: '192.168.1.' + (Math.floor(Math.random() * 200) + 10),
        status: 'new',
        providerId: 'provider-1',
        customerId: 'cust-' + Math.floor(Math.random() * 1000),
        customerName: 'Cliente Exemplo ' + Math.floor(Math.random() * 1000)
      },
      {
        id: 'dev-' + Math.random().toString(36).substr(2, 9),
        serialNumber: 'HW' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        oui: '001BC' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        productClass: 'Huawei HG658',
        softwareVersion: 'V' + Math.floor(Math.random() * 100) + 'R' + Math.floor(Math.random() * 10) + 'C' + Math.floor(Math.random() * 100),
        macAddress: '00:1B:C' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        ip: '192.168.1.' + (Math.floor(Math.random() * 200) + 10),
        status: 'new',
        providerId: 'provider-1',
        customerId: 'cust-' + Math.floor(Math.random() * 1000),
        customerName: 'Cliente Exemplo ' + Math.floor(Math.random() * 1000)
      }
    ];
    
    console.log(`Descobertos ${discoveredDevices.length} dispositivos`);
    return discoveredDevices;
  }

  /**
   * Executa o fluxo completo de provisionamento
   */
  async runFullProvisioningCycle() {
    console.log('Iniciando ciclo completo de provisionamento TR-069...\n');
    
    // Carrega templates
    await this.loadTemplates();
    
    // Simula descoberta de novos dispositivos
    const newDevices = await this.discoverDevices('192.168.1.0/24');
    
    // Provisiona cada novo dispositivo
    for (const device of newDevices) {
      console.log('\n' + '='.repeat(60));
      await this.provisionDevice(device);
      console.log('='.repeat(60) + '\n');
    }
    
    console.log('Ciclo de provisionamento concluído!');
  }
}

// Create Express app for HTTP server
const app = express();
const PORT = process.env.PORT || 7548;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'tr069-acs', timestamp: new Date().toISOString() });
});

// Get templates endpoint
app.get('/templates', (req, res) => {
  const provisioner = new TR069Provisioner({});
  res.json({
    templates: provisioner.templates || [],
    total: (provisioner.templates || []).length
  });
});

// Provision device endpoint
app.post('/provision', async (req, res) => {
  const provisioner = new TR069Provisioner({
    acsUrl: process.env.TR069_ACS_URL || 'http://localhost:7547',
    batchSize: parseInt(process.env.PROV_BATCH_SIZE) || 10
  });
  
  try {
    await provisioner.loadTemplates();
    const result = await provisioner.provisionDevice(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Discover devices endpoint
app.post('/discover', async (req, res) => {
  const provisioner = new TR069Provisioner({
    acsUrl: process.env.TR069_ACS_URL || 'http://localhost:7547',
    batchSize: parseInt(process.env.PROV_BATCH_SIZE) || 10
  });
  
  try {
    const devices = await provisioner.discoverDevices(req.body.networkRange || '192.168.1.0/24');
    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start HTTP server
if (require.main === module) {
  // Start the HTTP server
  app.listen(PORT, () => {
    console.log(`TR-069 ACS HTTP server listening on port ${PORT}`);
    
    // Also run the initial provisioning cycle
    const provisioner = new TR069Provisioner({
      acsUrl: process.env.TR069_ACS_URL || 'http://localhost:7547',
      batchSize: parseInt(process.env.PROV_BATCH_SIZE) || 10
    });
    
    provisioner.runFullProvisioningCycle()
      .then(() => console.log('Initial provisioning cycle completed'))
      .catch(console.error);
  });
}

module.exports = { TR069Provisioner, app };
