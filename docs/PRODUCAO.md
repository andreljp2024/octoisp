# Preparação para Produção - OctoISP

Este guia consolida os passos mínimos para colocar o OctoISP em produção com segurança.

## 1) Pré-requisitos obrigatórios

- Domínio público com certificado TLS válido.
- Supabase (cloud ou self-host) configurado com RLS ativo.
- Banco de métricas (TimescaleDB) provisionado.
- Redis disponível para filas e cache.
- Logs centralizados e monitoramento (Prometheus/Grafana).

## 2) Variáveis de ambiente

Copie `.env.production.example` para `.env.production` e preencha:

- `SUPABASE_JWT_SECRET` (obrigatório).
- `DATABASE_URL` e `METRICS_DB_URL`.
- `FRONTEND_URL` e `ALLOWED_ORIGINS`.
- `VITE_AUTH_MODE=supabase`, `VITE_ALLOW_DEMO_LOGIN=false` e `VITE_SUPABASE_ANON_KEY`.
- `INTEGRATION_ALLOWLIST` para restringir testes de conexão.
- `ALLOW_SIMULATION` apenas se for necessário rodar serviços simulados em staging.
- `LETSENCRYPT_ENABLED`, `LETSENCRYPT_EMAIL` e `LETSENCRYPT_DOMAINS` para TLS automático.
- `RATE_LIMIT_TENANT_MAX` para limitar requisições por usuário/tenant.

## 3) Autenticação

O build atual possui login de demonstração. Para produção:

- Desative o login demo (`VITE_ALLOW_DEMO_LOGIN=false`).
- Integre Supabase Auth no frontend.
- Garanta que o API Gateway valide JWTs com `SUPABASE_JWT_SECRET`.

Sem isso, **não é seguro** ir para produção.

Observação: as credenciais do Supabase usadas no login são definidas via variáveis
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no build. O menu de Configurações
serve para registrar integrações por provedor e não substitui a configuração de
autenticação do frontend.

## 4) Nginx/TLS

Use `nginx/nginx.prod.conf` com certificados em `./ssl/certs`:

- `fullchain.pem`
- `privkey.pem`

Ative HSTS e redirecionamento 80 → 443.

## 5) Docker Compose de produção

Utilize `docker-compose.prod.yml` com `.env.production`:

```
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Se desejar subir serviços auxiliares (SNMP/ACS/Alertas) em ambiente controlado:

```
docker compose -f docker-compose.prod.yml --env-file .env.production --profile optional-services up -d
```

## 6) Checklist de Go/No-Go

- [ ] Supabase com RLS ativado em todas as tabelas sensíveis.
- [ ] JWT Secret configurado e validado pelo API Gateway.
- [ ] CORS restrito ao domínio oficial.
- [ ] TLS ativo com certificado válido.
- [ ] Backups diários configurados.
- [ ] Logs centralizados com retenção.
- [ ] Rate limiting calibrado.
- [ ] Alertas críticos configurados.
- [ ] Monitoramento de filas e workers ativo.

## 7) Recomendado antes de entrar em produção

- Auditar permissões RBAC e roles padrão.
- Configurar política de senha e MFA.
- Definir retenção de métricas e agregações.
- Revisar integridade de métricas de POP e interfaces.
- Testar falha controlada e recuperação.
- Substituir respostas simuladas de ferramentas por execução real.

## 7.1) Migrações de banco

Se o banco já existe, aplique as migrações em ordem:

```
database/upgrade_v2.sql
database/upgrade_v3.sql
database/upgrade_v4.sql
database/upgrade_v5.sql
database/upgrade_v6.sql
database/upgrade_v7.sql
database/upgrade_v8.sql
```

Em instalações novas, execute `database/schema.sql` e depois as migrações acima.

## 10) Módulos ainda simulados

Até o momento, os serviços abaixo são simulados e **não devem** ser usados em produção:

- SNMP Monitor
- TR-069 ACS
- Alert Service
- Ferramentas de rede (execução real)

Para produção, estes módulos devem ser conectados a motores reais.

## 8) Observabilidade

Configure painéis de:

- Saúde do API Gateway (latência, erros).
- Filas (jobs, retries, DLQ).
- SNMP/ACS (dispositivos provisionados, falhas).
- POPs com maior consumo.

## 9) Segurança mínima

- Rotacione chaves e senhas a cada 90 dias.
- Bloqueie portas internas externas ao cluster.
- Restrinja acesso ao Redis e bancos de dados.
- Habilite `ALLOWED_ORIGINS` somente para seu domínio.

## 11) Assistente de instalação via web

Se quiser subir tudo via navegador, habilite:

- `SETUP_WIZARD_ENABLED=true`
- `SETUP_WIZARD_TOKEN=<token forte>`

Acesse `http(s)://<domínio>/setup` e siga o assistente.

Observação de segurança:

- O assistente utiliza o Docker do host. Em produção, isso exige montar o
  socket Docker no API Gateway. Use somente em ambientes controlados e
  desative após a implantação.
- Para Let’s Encrypt via assistente, defina `SETUP_HOST_DIR` com o caminho
  absoluto do projeto no host.

### Nota sobre preview e cache do PWA

Após mudanças no frontend, reconstrua o preview e limpe o cache do Service Worker:

```
docker compose -f docker-compose.preview.yml down
docker compose -f docker-compose.preview.yml up -d --build
```

No navegador: DevTools → Application → Service Workers → Unregister, depois
Application → Storage → Clear site data, e recarregue com `Ctrl+Shift+R`.

## 12) TLS automático (Let’s Encrypt)

Ao escolher Let’s Encrypt no assistente:

- O domínio precisa estar apontando para este servidor.
- A porta 80 precisa estar livre durante a emissão.
- O certificado é gravado automaticamente em `ssl/certs`.

## 13) Renovação automática

O container `certbot` renova certificados automaticamente a cada 12h.
Ative com:

```
docker compose -f docker-compose.prod.yml --env-file .env.production --profile optional-services up -d certbot
```
