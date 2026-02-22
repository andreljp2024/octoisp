# Arquitetura de Rede do OctoISP

## Visão Geral

O OctoISP é uma plataforma SaaS multi-tenant projetada para monitoramento, provisionamento e gerenciamento de redes ISP em larga escala. A arquitetura é baseada em microsserviços, orientada a eventos e preparada para suportar dezenas de milhares de CPEs e ONTs simultaneamente.

## Componentes da Arquitetura

### 1. Camada de Apresentação (Frontend PWA)
- Progressive Web App com React ou Vue
- Interface responsiva para desktop e mobile
- Funcionalidades offline com service workers
- Cache inteligente para melhor desempenho
- Ajuda contextual interativa por módulo e tema moderno com cards

### 2. Camada de Frontend (API Gateway)
- Roteamento de requisições para serviços apropriados
- Autenticação e autorização centralizadas
- Limitação de taxa (rate limiting)
- Log de requisições e monitoramento
- Isolamento de tenants por meio de identificação de tenant

### 3. Serviços de Backend
#### 3.1. Serviço ACS TR-069
- Implementação compatível com TR-069 e TR-181
- Registro e gerenciamento de dispositivos CPE
- Armazenamento de parâmetros de dispositivos
- Filas de comandos assíncronas multi-tenant

#### 3.2. Serviço de Monitoramento SNMP
- Polling distribuído de dispositivos via SNMP
- Suporte a SNMP v2c e v3
- Detecção automática de dispositivos
- Identificação por fingerprint de fabricantes
- Coleta de métricas de desempenho

#### 3.3. Serviço de Filas de Comandos
- Baseado em Redis para gerenciamento de tarefas
- Filas dedicadas por nível de tenant (small, medium, large)
- Controle de concorrência e limitação de taxa
- Recuperar com backoff exponencial
- Fila de morte (dead letter queue) para falhas persistentes

#### 3.4. Serviço de Processamento de Métricas
- Armazenamento otimizado para séries temporais
- Agregações automáticas (5min, 1h, 24h, 7 dias, 30 dias)
- Processamento de dados de tráfego, CPU, memória, latência, perda de pacotes

#### 3.5. Serviço de Alertas
- Regras configuráveis por dispositivo, grupo, POP ou Provedor
- Níveis de severidade (informativo, aviso, crítico)
- Deduplicação de eventos
- Janelas de estabilidade para evitar flapping
- Integrações para notificações (Push, Email, Telegram, Webhook)

### 4. Camada de Dados
#### 4.1. Banco de Dados Transacional (PostgreSQL via Supabase)
- Armazenamento de dados relacionais
- Autenticação e autorização com Row Level Security (RLS)
- Isolamento completo de dados por Provedor
- Tabelas para hierarquia Provedor → POP → Cliente → Dispositivo

#### 4.2. Banco de Dados de Séries Temporais
- Otimizado para armazenamento de métricas
- TimescaleDB ou solução similar
- Agregações automáticas de dados históricos

## Segurança e Isolamento

### 1. Modelo de Segurança Multi-Tenant
- Isolamento total de dados por Provedor usando RLS
- Políticas aplicadas a todas as tabelas sensíveis
- Validação baseada em `provider_id` associado ao usuário autenticado

### 2. Controle de Acesso Baseado em Funções (RBAC)
- Perfis predefinidos (Admin Global, Admin Provedor, NOC, Técnico, Visualizador)
- Permissões granulares por módulo e ação
- Tabelas `roles`, `permissions` e `user_permissions`
- Validação tanto no frontend quanto no backend

### 3. Autenticação e Autorização
- Integração com Supabase Auth
- Tokens JWT para identificação de usuário e tenant
- Auditoria imutável de todas as ações

## Monitoramento e Desempenho

### 1. Dashboard em Tempo Real
- Atualizações via WebSocket e Supabase Realtime
- Cache em memória para alta performance
- Visualização de dispositivos online/offline
- Consumo agregado de banda e alertas ativos
- Monitoramento de interfaces por equipamento e POP

### 2. Infraestrutura de Monitoramento
- Prometheus para coleta de métricas do sistema
- Grafana para visualização de métricas
- Logs centralizados com Winston
- Monitoramento interno de filas e workers

## Dimensionamento e Alta Disponibilidade

### 1. Escalabilidade Horizontal
- Serviços ACS e Workers SNMP dimensionáveis independentemente
- Balanceamento de carga via Nginx
- Filas de mensagens para desacoplamento de serviços

### 2. Resiliência
- Recuperação automática de falhas
- Replicação de dados
- Monitoramento contínuo de saúde dos serviços

## Protocolos e Tecnologias de Rede

### 1. TR-069 / TR-181
- Protocolo padrão para gerenciamento de dispositivos CPE
- Registro automático de dispositivos (inform)
- Armazenamento de parâmetros como SerialNumber, OUI, ProductClass, etc.
- Provisionamento baseado em templates

### 2. SNMP
- Versões v2c e v3 suportadas
- Motor de polling inteligente baseado em prioridade
- Identificação automática por OID e fingerprint de fabricantes
- Coleta de informações de desempenho e status

### 3. Protocolos de Monitoramento
- IP Scanner, Port Scanner TCP/UDP
- Ping contínuo, MTR gráfico, Traceroute
- Consulta DNS e teste HTTP/HTTPS

## Considerações de Desempenho

### 1. Otimização de Consultas
- Índices adequados em todas as colunas frequentemente consultadas
- Consultas otimizadas considerando o isolamento por tenant
- Paginação para grandes conjuntos de dados

### 2. Cache
- Cache em memória para dados frequentemente acessados
- Cache HTTP apropriado para recursos estáticos
- Cache de consultas no frontend

## Considerações Operacionais

### 1. Manutenção Preventiva
- Rotinas de limpeza de dados antigos
- Compactação de dados históricos
- Atualizações regulares de segurança

### 2. Backup e Recuperação
- Cópias de segurança regulares dos dados transacionais
- Estratégia de recuperação de desastres
- Testes periódicos de restauração

## Integrações Externas

### 1. Canais de Notificação
- Integração com Web Push API
- Envio de e-mails transacionais
- Integração com Telegram para notificações
- Webhooks para sistemas externos

### 2. Ferramentas de Terceiros
- Integração com sistemas de ticketing
- Exportação de relatórios em PDF e CSV
- Conectividade com APIs de parceiros

Esta arquitetura proporciona uma base sólida e escalável para o gerenciamento de redes ISP em larga escala, mantendo a segurança e o isolamento necessário entre diferentes provedores de serviço.
