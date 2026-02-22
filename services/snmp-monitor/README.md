# Serviço de Monitoramento SNMP

O serviço de monitoramento SNMP fornece polling e monitoramento distribuídos de dispositivos de rede via SNMP.

## Recursos

- Suporte a SNMP v2c e v3
- Engine de polling distribuído
- Descoberta automática de dispositivos
- Identificação por fingerprint de fornecedor
- Coleta de métricas de desempenho
- Monitoramento por limiares e alertas
- Isolamento multi-tenant

## Capacidades

- Polling de MIBs padrão (interfaces, sistema, etc.)
- Suporte a MIBs personalizadas
- Monitoramento de utilização de banda
- Monitoramento de CPU e memória
- Monitoramento de temperatura e ambiente
- Monitoramento de status de interface
- Descoberta automática de dispositivos

## Configuração

O serviço lê as configurações de dispositivos do banco de dados principal e aplica intervalos de polling apropriados com base na prioridade e criticidade do dispositivo.

## Integração

- Métricas armazenadas em banco de dados de séries temporais
- Alertas enviados ao serviço de alerta
- Informações de dispositivo sincronizadas com o registro principal de dispositivos

## Variáveis de Ambiente

- `NODE_ENV` - Modo ambiente (desenvolvimento/produção)
- `REDIS_URL` - String de conexão Redis para filas de tarefas
- `DATABASE_URL` - String de conexão PostgreSQL para dados de dispositivos
- `METRICS_DB_URL` - String de conexão do banco de dados de séries temporais
- `PORT` - Porta do serviço (padrão: 8080)

## Executando Localmente

```bash
npm install
npm start
```

Ou com Docker:

```bash
docker build -t octoisp-snmp-monitor .
docker run -p 8080:8080 octoisp-snmp-monitor
```