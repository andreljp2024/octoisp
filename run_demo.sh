#!/bin/bash

# Script para executar o ambiente de demonstração do OctoISP com um único comando

set -e  # Sair se qualquer comando falhar

echo "=================================================="
echo "Executando ambiente de demonstração do OctoISP"
echo "=================================================="

# Verificar se os pré-requisitos estão instalados
command -v docker >/dev/null 2>&1 || { echo >&2 "ERRO: Docker é necessário mas não está instalado. Abortando."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo >&2 "ERRO: Docker Compose é necessário mas não está instalado. Abortando."; exit 1; }

# Verificar se os arquivos necessários existem
REQUIRED_FILES=(
    "docker-compose.preview.yml"
    "init_demo_env.sh"
    "database/schema.sql"
    "database/demo_setup.sql"
    "nginx-preview/nginx.conf"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "ERRO: Arquivo necessário ausente: $file"
        exit 1
    fi
done

# Tornar o script de inicialização executável
chmod +x init_demo_env.sh

echo "Iniciando o ambiente de demonstração..."

# Executar o script de inicialização
./init_demo_env.sh

echo ""
echo "=================================================="
echo "Ambiente de demonstração iniciado com sucesso!"
echo ""
echo "Acesse a plataforma em: http://localhost:8080"
echo ""
echo "Credenciais de demonstração:"
echo "  Usuário: demo@octoisp.local"
echo "  Senha: Demo123!@#"
echo ""
echo "Para parar o ambiente: docker-compose -f docker-compose.preview.yml down"
echo "=================================================="