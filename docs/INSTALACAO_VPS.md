# Instalação e Deploy em VPS (Produção)

Este guia mostra como instalar o OctoISP em uma VPS Linux (Ubuntu/Debian) com Docker.

## 1) Pré‑requisitos

- VPS com acesso root ou sudo
- Domínio apontando para o IP da VPS
- Portas 80 e 443 liberadas no firewall
- Docker + Docker Compose instalados

## 2) Preparar a VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw

# Firewall básico
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 3) Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

docker version
docker compose version
```

## 4) Clonar o projeto

```bash
git clone <seu-repositorio> octoisp
cd octoisp
```

## 5) Configurar variáveis de produção

Crie o arquivo `.env.production` com base no exemplo:

```bash
cp .env.production.example .env.production
nano .env.production
```

Preencha pelo menos:

- `FRONTEND_URL`, `ALLOWED_ORIGINS`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
- `DATABASE_URL`, `METRICS_DB_URL`, `REDIS_URL`
- `SETUP_WIZARD_ENABLED`, `SETUP_WIZARD_TOKEN`
- `SETUP_HOST_DIR` (caminho absoluto do projeto, ex: `/home/ubuntu/octoisp`)

## 6) Deploy via assistente (recomendado)

Suba o stack básico:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Abra no navegador:

```
https://seu-dominio/setup
```

Complete os passos do assistente:

- Configurar Supabase
- Configurar bancos e Redis
- Configurar domínio e TLS (Let’s Encrypt ou manual)
- Iniciar deploy (tempo real)

## 7) Deploy manual (alternativa)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 8) Let’s Encrypt automático

Se usar Let’s Encrypt via assistente:

- Domínio deve estar apontado para a VPS
- Porta 80 precisa estar livre

Para renovação automática:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production --profile optional-services up -d certbot
```

## 9) Checagem rápida

```bash
docker compose -f docker-compose.prod.yml ps
curl -k https://seu-dominio/health
```

## 10) Segurança recomendada

- Desative o assistente após o deploy:
  - `SETUP_WIZARD_ENABLED=false`
- Restrinja `ALLOWED_ORIGINS` ao domínio real
- Revise RBAC e permissões
- Configure backups do banco

---

Se quiser, posso automatizar todo o processo para sua VPS específica.
