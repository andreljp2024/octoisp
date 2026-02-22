# Serviço TR-069 ACS

O servidor de configuração automática TR-069 (ACS) é responsável por gerenciar dispositivos CPE através do protocolo TR-069.

## Recursos

- Suporte completo a TR-069 e TR-181
- Registro e autenticação de dispositivos
- Armazenamento e recuperação de parâmetros
- Enfileiramento assíncrono de comandos
- Provisionamento baseado em modelos
- Isolamento multi-tenant

## Endpoints

- `/acs` - Endpoint principal para conexões CPE
- `/acs/devices` - Gerenciar dispositivos registrados
- `/acs/devices/:id/commands` - Enviar comandos para dispositivos
- `/acs/templates` - Gerenciar modelos de provisionamento

## Variáveis de Ambiente

- `NODE_ENV` - Modo ambiente (desenvolvimento/produção)
- `REDIS_URL` - String de conexão Redis para enfileiramento de comandos
- `DATABASE_URL` - String de conexão PostgreSQL para dados de dispositivos
- `PORT` - Porta do serviço (padrão: 7547)

## Executando Localmente

```bash
npm install
npm start
```

Ou com Docker:

```bash
docker build -t octoisp-tr069-acs .
docker run -p 7547:7547 octoisp-tr069-acs
```