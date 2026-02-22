@echo off
setlocal

echo ###########################################################################
echo #                                                                         #
echo #        INSTRUÇÕES PARA EXECUTAR O AMBIENTE DE DEMONSTRAÇÃO OCTOISP      #
echo #                                                                         #
echo ###########################################################################
echo.
echo Passo 1: Instalar o Docker Desktop
echo -------------------------------
echo.
echo O ambiente de demonstração do OctoISP requer o Docker Desktop instalado.
echo.
echo Para instalar o Docker Desktop no Windows:
echo.
echo 1. Acesse: https://www.docker.com/products/docker-desktop
echo 2. Faça download e instale a versão mais recente para Windows
echo 3. Siga o assistente de instalação
echo 4. Reinicie seu computador após a instalação
echo 5. Inicie o Docker Desktop e aguarde o ícone na bandeja do sistema ficar verde
echo.
echo Pressione qualquer tecla após instalar e iniciar o Docker Desktop...
pause >nul
echo.
echo Passo 2: Verificar a instalação do Docker
echo ------------------------------------------
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERRO: O Docker ainda não está instalado ou não está em execução.
    echo.
    echo Por favor:
    echo - Verifique se você baixou e instalou o Docker Desktop corretamente
    echo - Verifique se o Docker Desktop está em execução (ícone verde na bandeja)
    echo - Reinicie seu computador se necessário
    echo.
    pause
    exit /b 1
) else (
    echo Docker está instalado corretamente!
    docker-compose --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo AVISO: O docker-compose não foi encontrado, mas o Docker está instalado.
        echo O Docker Desktop geralmente inclui o docker-compose automaticamente.
    ) else (
        echo Docker Compose também está instalado corretamente!
    )
)
echo.
echo Passo 3: Executar o ambiente de demonstração
echo ----------------------------------------------
echo.
echo O ambiente de demonstração do OctoISP está pronto para ser executado.
echo.
echo Para executar o ambiente de demonstração, execute o seguinte comando:
echo.
echo    run_demo.bat
echo.
echo Ou, se preferir, execute diretamente:
echo.
echo    docker-compose -f docker-compose.preview.yml up -d
echo.
echo A aplicação estará disponível em: http://localhost:8080
echo.
echo Credenciais de demonstração:
echo   Usuario: demo@octoisp.local
echo   Senha: Demo123!@#
echo.
echo Passo 4: Parar o ambiente de demonstração
echo -------------------------------------------
echo.
echo Para parar o ambiente de demonstração, execute:
echo.
echo    docker-compose -f docker-compose.preview.yml down
echo.
echo ###########################################################################
echo #                                                                         #
echo #        AMBIENTE DE DEMONSTRAÇÃO OCTOISP - INSTRUÇÕES CONCLUÍDAS         #
echo #                                                                         #
echo ###########################################################################

pause