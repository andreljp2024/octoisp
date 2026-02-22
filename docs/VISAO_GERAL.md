# Visão Geral do Sistema OctoISP

## O que é o OctoISP?

O OctoISP é uma plataforma SaaS (Software as a Service) multi-tenant projetada especificamente para o monitoramento, provisionamento e gerenciamento de redes ISP (Internet Service Provider) em larga escala. A plataforma é construída com uma arquitetura moderna baseada em microsserviços, orientada a eventos e preparada para suportar dezenas de milhares de CPEs (Customer Premises Equipment) e ONTs (Optical Network Terminals) simultaneamente.

## Arquitetura do Sistema

### Componentes Principais

#### 1. Frontend PWA (Progressive Web App)
- Interface de usuário responsiva construída com React ou Vue
- Totalmente funcional offline com service workers
- Instalável em dispositivos móveis e desktop
- Notificações push para alertas críticos
- Dashboard em tempo real com atualizações via WebSocket
- Ajuda contextual interativa com checklists por módulo
- Tema moderno com cards e gráficos animados

#### 2. API Gateway
- Ponto central de entrada para todas as requisições
- Autenticação e autorização centralizadas
- Roteamento de requisições para serviços específicos
- Isolamento de tenants por meio de identificação de tenant
- Limitação de taxa e segurança avançada

#### 3. Serviços de Backend

##### 3.1 Serviço ACS TR-069
- Implementação compatível com TR-069 e TR-181
- Registro automático de dispositivos (INFORM)
- Armazenamento de parâmetros como SerialNumber, OUI, ProductClass, etc.
- Provisionamento baseado em templates por fabricante/modelo
- Filas de comandos assíncronas com isolamento por tenant

##### 3.2 Serviço de Monitoramento SNMP
- Polling distribuído de dispositivos via SNMP v2c/v3
- Detecção automática de dispositivos e fingerprinting por fabricante
- Coleta de métricas de desempenho (CPU, memória, temperatura, etc.)
- Identificação por OID e armazenamento de dados de interface

##### 3.3 Serviço de Filas de Comandos
- Gerenciamento de filas com Redis
- Filas dedicadas para tenants grandes
- Filas compartilhadas para tenants pequenos e médios
- Controle de jobs concorrentes e limitação de taxa
- Recuperação com backoff exponencial e filas de morte

##### 3.4 Serviço de Processamento de Métricas
- Banco de dados otimizado para séries temporais
- Agregações automáticas (5min, 1h, 24h, 7 dias, 30 dias)
- Armazenamento eficiente de tráfego, CPU, memória, latência, etc.

##### 3.5 Serviço de Alertas
- Motor de regras configurável por dispositivo, grupo, POP ou Provedor
- Níveis de severidade (informativo, aviso, crítico)
- Deduplicação de eventos e janelas de estabilidade
- Integrações para notificações (Push, Email, Telegram, Webhook)

### Camada de Dados

#### PostgreSQL (via Supabase)
- Banco de dados transacional com RLS (Row Level Security)
- Isolamento total de dados por Provedor
- Autenticação e autorização integradas
- Armazenamento da hierarquia Provedor → POP → Cliente → Dispositivo

#### Banco de Dados de Séries Temporais
- TimescaleDB ou solução similar
- Otimizado para armazenamento de métricas
- Agregações automáticas de dados históricos

## Segurança e Isolamento

### Modelo de Segurança Multi-Tenant
- Isolamento total de dados por Provedor usando RLS
- Políticas aplicadas a todas as tabelas sensíveis
- Validação baseada em `provider_id` associado ao usuário autenticado
- Auditoria imutável de todas as ações

### Controle de Acesso Baseado em Funções (RBAC)
- Perfis predefinidos (Admin Global, Admin Provedor, NOC, Técnico, Visualizador)
- Permissões granulares por módulo e ação
- Tabelas `roles`, `permissions` e `user_permissions`
- Validação tanto no frontend quanto no backend

## Recursos Avançados

### Hierarquia Organizacional
- Provedor → POP → Cliente → Dispositivo
- Relacionamentos 1:N rigorosamente aplicados
- Aplicação de RLS em todos os níveis hierárquicos

### Provisionamento Automático
- Templates versionados por fabricante e modelo
- Configuração remota de SSID, senha WiFi, canais, etc.
- Ativação/desativação de bandas 2.4GHz e 5GHz
- Reinícios remotos e aplicação de políticas
- Auditoria imutável de todas as alterações

### Ferramentas de Rede
- Scanner de IP, Scanner de Porta TCP/UDP
- Ping contínuo, MTR gráfico, Traceroute
- Consulta DNS e teste HTTP/HTTPS
- Histórico armazenado com respeito ao RLS
- Execução remota vinculada a CPE/ONT e POP

### Monitoramento de Interfaces
- Seleção hierárquica Provedor → POP → Equipamento → Interface
- Tráfego em tempo real com download, upload e erros
- Indicadores de utilização e status por interface

### Relatórios e Exportações
- Relatórios de SLA por Provedor e POP
- Consumo de banda e histórico de incidentes
- Exportações em PDF e CSV
- Agendamento de relatórios

## Escalabilidade e Desempenho

### Dimensionamento Horizontal
- Serviços ACS e Workers SNMP dimensionáveis independentemente
- Balanceamento de carga via Nginx
- Filas de mensagens para desacoplamento de serviços

### Desempenho em Tempo Real
- Atualizações via WebSocket e Supabase Realtime
- Cache em memória para alta performance
- Indexação otimizada para consultas frequentes

## Tecnologias Utilizadas

### Backend
- Node.js / Go para microsserviços
- Supabase (PostgreSQL, Auth, Realtime)
- Redis para filas e cache
- TimescaleDB para métricas

### Frontend
- React ou Vue com Tailwind CSS
- Progressive Web App com service workers
- Recharts para visualização de dados
- React Query para gerenciamento de estado
- Ajuda contextual e preferências de interface integradas

### Infraestrutura
- Docker e Docker Compose para containerização
- Nginx como proxy reverso
- Prometheus e Grafana para monitoramento

## Benefícios do OctoISP

### Para Provedores de Internet
- Redução de custos operacionais com automação
- Melhoria na qualidade do serviço com monitoramento contínuo
- Agilidade no provisionamento de novos clientes
- Visibilidade total da infraestrutura de rede

### Para Equipes de Operações
- Interface unificada para gerenciamento de todos os dispositivos
- Alertas inteligentes com redução de ruído
- Notificações push para incidentes críticos
- Ferramentas avançadas de troubleshooting
- Ajuda contextual para acelerar o onboarding da equipe NOC

### Para Técnicos de Campo
- Informações detalhadas sobre dispositivos antes da visita
- Possibilidade de provisionamento remoto
- Diagnósticos prévios via ferramentas de rede
- Histórico de alterações e eventos

## Conclusão

O OctoISP representa uma solução completa e moderna para o gerenciamento de redes ISP em larga escala. Com sua arquitetura baseada em microsserviços, segurança multi-tenant e recursos avançados de monitoramento e provisionamento, a plataforma está pronta para atender às demandas de provedores de internet de todos os portes, desde pequenos provedores locais até grandes operadoras regionais.
