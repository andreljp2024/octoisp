#!/bin/bash

# Script para inicializar o ambiente de demonstração do OctoISP

echo "==========================================="
echo "Inicializando ambiente de demonstração do OctoISP"
echo "==========================================="

# Verificar se o Docker está instalado
if ! [ -x "$(command -v docker)" ]; then
  echo "Erro: Docker não está instalado." >&2
  exit 1
fi

# Verificar se o Docker Compose está instalado
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Erro: Docker Compose não está instalado." >&2
  exit 1
fi

# Criar diretórios necessários
mkdir -p nginx-preview ssl/certs logs

# Criar um certificado autoassinado para testes (opcional)
echo "Gerando certificado autoassinado para testes..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/certs/nginx.key \
  -out ssl/certs/nginx.crt \
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=OctoISP/OU=Demo/CN=localhost"

# Subir os serviços de demonstração
echo "Subindo os serviços de demonstração..."
docker-compose -f docker-compose.preview.yml up -d

# Aguardar um pouco para os serviços iniciarem
echo "Aguardando inicialização dos serviços..."
sleep 20

# Mostrar status dos serviços
echo "Status dos serviços:"
docker-compose -f docker-compose.preview.yml ps

echo ""
echo "==========================================="
echo "Ambiente de demonstração pronto!"
echo ""
echo "Acesse a plataforma em: http://localhost:8080"
echo ""
echo "Credenciais de demonstração:"
echo "  Usuário: demo@octoisp.local"
echo "  Senha: Demo123!@#"
echo ""
echo "Para parar o ambiente: docker-compose -f docker-compose.preview.yml down"
echo "==========================================="