const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para configurar o ambiente de preview do OctoISP
 * Este script automatiza a criação de todos os componentes necessários
 */

class PreviewSetup {
  constructor() {
    this.steps = [
      this.createDirectories,
      this.createPreviewDockerfiles,
      this.setupDatabaseScripts,
      this.createStartupScript,
      this.createDocumentation
    ];
  }

  async run() {
    console.log('🚀 Iniciando configuração do ambiente de preview do OctoISP...\n');

    for (const [index, step] of this.steps.entries()) {
      try {
        console.log(`(${index + 1}/${this.steps.length}) Executando: ${step.name.replace(/([A-Z])/g, ' $1').trim()}`);
        await step.call(this);
        console.log('✅ Concluído\n');
      } catch (error) {
        console.error(`❌ Erro ao executar ${step.name}:`, error.message);
        process.exit(1);
      }
    }

    console.log('🎉 Configuração do ambiente de preview concluída com sucesso!');
    console.log('\nPara iniciar o ambiente, execute:');
    console.log('chmod +x init_demo_env.sh');
    console.log('./init_demo_env.sh');
  }

  createDirectories() {
    // Certificar que os diretórios necessários existem
    const dirs = [
      'nginx-preview',
      'ssl/certs',
      'logs'
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  createPreviewDockerfiles() {
    // Verificar se os Dockerfiles de preview já existem
    const services = ['tr069-acs', 'snmp-monitor', 'alert-service', 'api-gateway'];
    
    for (const service of services) {
      const dockerfilePath = path.join('services', service, `Dockerfile.preview`);
      
      if (!fs.existsSync(dockerfilePath)) {
        let dockerfileContent = '';
        if (service === 'tr069-acs') {
          dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=preview

EXPOSE 7548

CMD ["npm", "start"]
`;
        } else if (service === 'snmp-monitor') {
          dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=preview

EXPOSE 8080

CMD ["npm", "start"]
`;
        } else if (service === 'alert-service') {
          dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=preview

EXPOSE 8080

CMD ["npm", "start"]
`;
        } else if (service === 'api-gateway') {
          dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=preview

EXPOSE 8000

CMD ["npm", "start"]
`;
        }

        fs.writeFileSync(dockerfilePath, dockerfileContent);
      }
    }
  }

  setupDatabaseScripts() {
    // Já criamos o demo_setup.sql anteriormente, mas podemos verificar
    const schemaPath = './database/schema.sql';
    const demoSetupPath = './database/demo_setup.sql';
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Arquivo ${schemaPath} não encontrado`);
    }
    
    if (!fs.existsSync(demoSetupPath)) {
      throw new Error(`Arquivo ${demoSetupPath} não encontrado`);
    }
  }

  createStartupScript() {
    // O script init_demo_env.sh já foi criado, mas vamos verificar
    const scriptPath = './init_demo_env.sh';
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script ${scriptPath} não encontrado`);
    }
    
    // Tornar o script executável
    fs.chmodSync(scriptPath, '755');
  }

  createDocumentation() {
    // A documentação já foi criada, mas vamos verificar
    const docPath = './docs/AMBIENTE_DEMONSTRACAO.md';
    
    if (!fs.existsSync(docPath)) {
      throw new Error(`Documento ${docPath} não encontrado`);
    }
  }
}

// Executar o script se chamado diretamente
if (require.main === module) {
  const setup = new PreviewSetup();
  
  setup.run()
    .catch(error => {
      console.error('Erro na configuração do ambiente de preview:', error);
      process.exit(1);
    });
}

module.exports = PreviewSetup;