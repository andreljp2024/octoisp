@echo off
setlocal

echo ==================================================
echo Executando ambiente de demonstracao do OctoISP
echo ==================================================

REM Verificar se os requisitos estao instalados
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker e necessario mas nao esta instalado. Abortando.
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker Compose e necessario mas nao esta instalado. Abortando.
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

REM Verificar se os arquivos necessarios existem
if not exist "docker-compose.preview.yml" (
    echo ERRO: Arquivo docker-compose.preview.yml nao encontrado
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "init_demo_env.bat" (
    echo ERRO: Arquivo init_demo_env.bat nao encontrado
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "database\schema.sql" (
    echo ERRO: Arquivo database\schema.sql nao encontrado
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "database\demo_setup.sql" (
    echo ERRO: Arquivo database\demo_setup.sql nao encontrado
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "nginx-preview\nginx.conf" (
    echo ERRO: Arquivo nginx-preview\nginx.conf nao encontrado
    if not "%OCTOISP_NO_PAUSE%"=="1" pause
    exit /b 1
)

echo Iniciando o ambiente de demonstracao...

REM Executar o script de inicializacao
call init_demo_env.bat

echo.
echo ==================================================
echo Ambiente de demonstracao iniciado com sucesso!
echo.
echo Acesse a plataforma em: http://localhost:8080
echo.
echo Credenciais de demonstracao:
echo   Usuario: demo@octoisp.local
echo   Senha: Demo123!@#
echo.
echo Para parar o ambiente: docker-compose -f docker-compose.preview.yml down
echo ==================================================

if not "%OCTOISP_NO_PAUSE%"=="1" pause
