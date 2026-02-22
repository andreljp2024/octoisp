# OctoISP - Plataforma de Gerenciamento de Redes ISP Multi-Tenant

OctoISP é uma plataforma SaaS abrangente projetada para monitoramento, provisionamento e gerenciamento de redes ISP em larga escala. Construída com uma arquitetura moderna de microsserviços, ela é orientada a eventos e preparada para suportar dezenas de milhares de CPEs e ONTs simultaneamente.

## Principais recursos

### Arquitetura Principal
- **Design multi-tenant** com isolamento completo de dados entre provedores
- **Backend alimentado pelo Supabase** (PostgreSQL, Auth, Realtime, Storage)
- **Segurança no Nível de Linha (RLS)** habilitada em todas as tabelas sensíveis
- **Separação dos planos de controle e dados**
- **Serviços containerizados** via Docker

### Arquitetura de Serviços
- **Frontend PWA**: React/Vue + Tailwind
- **Gateway de API**: Roteamento e autenticação centralizados
- **Serviço ACS TR-069**: Implementação TR-069/181 escalável horizontalmente
- **Serviço de Monitoramento SNMP**: Monitoramento de rede distribuído
- **Serviço de Fila de Comandos**: Enfileiramento de tarefas baseado em Redis
- **Serviço de Processamento de Métricas**: Tratamento de métricas em série temporal
- **Serviço de Alertas**: Gerenciamento de eventos e notificações
- **Proxy Reverso Nginx**: Balanceamento de carga e terminação SSL

### Gerenciamento de Dados
- **Banco de Dados Transacional**: PostgreSQL via Supabase
- **Banco de Dados de Métricas**: Armazenamento otimizado para séries temporais
- **Agregações automáticas**: Rollups de 5min, 1h, 24h, 7d, 30d
- **Organização hierárquica**: Provedor → POP → Cliente → Dispositivo

### Controle de Acesso
- **Sistema RBAC** com permissões granulares por módulo
- **Perfis predefinidos**: Administrador Global, Administrador Provedor, NOC, Técnico, Visualizador
- **Permissões personalizadas** por usuário
- **Validação frontend e backend**

### Monitoramento e Descoberta
- **Dashboard em tempo real** com atualizações via WebSocket
- **Polling SNMP distribuído** suportando v2/v3
- **Descoberta automática de dispositivos** com reconhecimento por fingerprint de fabricante
- **Registro de dispositivos TR-069/181** e coleta de parâmetros
- **Monitoramento de interfaces** com tráfego, utilização e erros por equipamento

### Provisionamento
- **Configuração baseada em modelos** por fabricante/modelo
- **Gerenciamento remoto de WiFi** (SSID, senhas, canais)
- **Reinicializações remotas** e comandos avançados
- **Registro de auditoria imutável**

### Ferramentas de Rede
- **Scanner de IP**, Scanner de Porta, Ping, MTR, Traceroute
- **Consulta DNS** e testes HTTP/HTTPS
- **Histórico com controle de permissão**

### Alertas e Notificações
- **Alertas configuráveis** por níveis de severidade
- **Notificações Push** (Web Push API)
- **Integrações por Email, Telegram, Webhook**
- **Janelas de estabilidade** para prevenir flapping

### Aplicativo Web Progressivo
- **Capacidades offline** com service workers
- **Instalação em desktop e mobile**
- **Notificações push** para equipe NOC
- **Ajuda contextual interativa** com checklist operacional por módulo
- **Tema moderno com cards e gráficos animados**

### Relatórios
- **Relatórios exportáveis** (PDF, CSV)
- **Relatórios de SLA** por Provedor e POP
- **Uso de banda** e histórico de incidentes

## Ambiente de Demonstração

O OctoISP inclui um ambiente de demonstração para que interessados possam experimentar a plataforma com um conjunto limitado de recursos e dados.

### Requisitos para Execução

Antes de executar o ambiente de demonstração, é necessário instalar o Docker Desktop:

1. **Docker Desktop** - [Instruções de instalação para Windows](./INSTALACAO_DOCKER_WINDOWS.md)
2. **Sistema operacional compatível** - Windows 10/11, Linux ou macOS
3. **Recursos mínimos** - 4GB RAM (recomendado 8GB)
4. **Espaço em disco** - 5GB livres

### Como Acessar o Ambiente de Demonstração

#### No Windows:

1. Após instalar o Docker Desktop, execute o script de inicialização:
   ```
   run_demo.bat
   ```

2. Acesse a plataforma em: `http://localhost:8080`

3. Faça login com as credenciais:
   - **E-mail**: `demo@octoisp.local`
   - **Senha**: `Demo123!@#`

#### Em Linux/macOS:

1. Execute o script de inicialização:
   ```bash
   chmod +x run_demo.sh
   ./run_demo.sh
   ```

2. Acesse a plataforma em: `http://localhost:8080`

3. Faça login com as credenciais:
   - **E-mail**: `demo@octoisp.local`
   - **Senha**: `Demo123!@#`

Para mais detalhes sobre a execução do ambiente de demonstração, consulte [EXECUCAO_DEMONSTRACAO.md](./EXECUCAO_DEMONSTRACAO.md).

## Pilha Tecnológica

- **Backend**: Microsserviços Node.js/Go
- **Banco de Dados**: PostgreSQL (Supabase)
- **Série Temporal**: InfluxDB ou TimescaleDB
- **Fila de Mensagens**: Redis
- **Frontend**: PWA React/Vue
- **Monitoramento**: Prometheus/Grafana
- **Containerização**: Docker, Docker Compose
- **Proxy Reverso**: Nginx

## Começando

Consulte os guias de operação e arquitetura em `docs/`:

- `docs/VISAO_GERAL.md`
- `docs/GUIA_USO_INTERFACE.md`
- `docs/ARQUITETURA_REDE.md`
- `docs/MELHORES_PRATICAS.md`
- `docs/PRODUCAO.md`
- `docs/INSTALACAO_VPS.md`
