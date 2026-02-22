@echo off
setlocal

echo ===========================================
echo Inicializando ambiente de demonstracao do OctoISP
echo ===========================================

REM Verificar se o Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Docker nao esta instalado ou nao esta no PATH.
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

REM Verificar se o Docker Compose esta instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erro: Docker Compose nao esta instalado ou nao esta no PATH.
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

REM Criar diretorios necessarios
if not exist "nginx-preview" mkdir nginx-preview
if not exist "ssl\certs" mkdir ssl\certs 2>nul
if not exist "logs" mkdir logs

REM Gerar certificado autoassinado para testes (opcional)
echo Gerando certificado autoassinado para testes...
openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
  -keyout ssl/certs/nginx.key ^
  -out ssl/certs/nginx.crt ^
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=OctoISP/OU=Demo/CN=localhost" 2>nul
if %errorlevel% neq 0 (
    echo AVISO: OpenSSL nao encontrado. Ignorando geracao de certificado.
)

REM Subir os servicos de demonstracao
echo Subindo os servicos de demonstracao...
docker-compose -f docker-compose.preview.yml up -d

REM Aguardar um pouco para os servicos iniciarem
echo Aguardando inicializacao dos servicos...
timeout /t 20 /nobreak >nul

REM Mostrar status dos servicos
echo Status dos servicos:
docker-compose -f docker-compose.preview.yml ps

echo.
echo ===========================================
echo Ambiente de demonstracao pronto!
echo.
echo Acesse a plataforma em: http://localhost:8080
echo.
echo Credenciais de demonstracao:
echo   Usuario: demo@octoisp.local
echo   Senha: Demo123!@#
echo.
echo Para parar o ambiente: docker-compose -f docker-compose.preview.yml down
echo ===========================================

if not "%OCTOISP_NO_PAUSE%"=="1" pause
