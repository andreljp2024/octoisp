# Serviço de Alertas

O serviço de alertas gerencia a criação, processamento e notificação de alertas baseados em eventos e limiares do sistema.

## Recursos

- Regras de alerta configuráveis por dispositivo, grupo, POP ou Provedor
- Múltiplos níveis de severidade (info, aviso, crítico)
- Duplicação de eventos
- Janelas de estabilidade para prevenir flapping de alertas
- Notificações multicanal (Push, E-mail, Telegram, Webhook)
- Correlação e agrupamento de alertas

## Componentes

- Engine de regras para definição de condições de alerta
- Gerenciador de notificações para envio de alertas
- Processador de deduplicação
- Gerenciador de escalonamento
- Histórico e estatísticas de alertas

## Pontos de Integração

- Recebe métricas dos serviços de monitoramento
- Armazena alertas no banco de dados principal
- Envia notificações via canais configurados
- Integra-se com a interface para gerenciamento de alertas

## Configuração

- Regras de alerta podem ser configuradas por tenant
- Preferências de notificação por usuário
- Configurações de integração para serviços externos (SMTP, Telegram, etc.)

## Variáveis de Ambiente

- `NODE_ENV` - Modo ambiente (desenvolvimento/produção)
- `REDIS_URL` - String de conexão Redis para filas
- `DATABASE_URL` - String de conexão PostgreSQL para dados de alerta
- `SMTP_HOST` - Servidor SMTP para notificações por e-mail
- `SMTP_PORT` - Porta SMTP
- `TELEGRAM_BOT_TOKEN` - Token do bot do Telegram para notificações
- `PORT` - Porta do serviço (padrão: 8080)

## Executando Localmente

```bash
npm install
npm start
```

Ou com Docker:

```bash
docker build -t octoisp-alert-service .
docker run -p 8080:8080 octoisp-alert-service
```