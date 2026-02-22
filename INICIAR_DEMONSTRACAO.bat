@echo off
setlocal

echo ###########################################################################
echo #                                                                         #
echo #        GUIA PARA EXECUTAR O AMBIENTE DE DEMONSTRA├ç├âO DO OCTOISP          #
echo #                                                                         #
echo ###########################################################################
echo.
echo PASSO 1: Instalar o Docker Desktop
echo -------------------------------
echo.
echo Se o Docker Desktop ainda n├úo estiver instalado:
echo.
echo 1. Acesse o navegador e vá para: https://www.docker.com/products/docker-desktop
echo 2. Fa├ºa download e instale a vers├úo mais recente para Windows
echo 3. Execute o instalador como administrador
echo 4. Durante a instala├º├úo, habilite a integra├º├úo com WSL 2 (j├í instalado)
echo 5. Reinicie seu computador ap├│s a instala├º├úo
echo 6. Inicie o Docker Desktop e aguarde o ├¡cone na bandeja ficar verde
echo.
echo PRESS ONE TECLA PARA CONTINUAR PARA O PR├ôXIMO PASSO...
pause >nul
echo.
echo PASSO 2: Verificar Instala├º├úo
echo -------------------------
echo.
echo Ap├│s reiniciar e iniciar o Docker Desktop, verifique se est├í funcionando:
echo.
echo 1. Abra um novo terminal (PowerShell ou Command Prompt)
echo 2. Execute: docker --version
echo 3. Execute: docker-compose --version
echo.
echo Ambos os comandos devem retornar as vers├Áes instaladas.
echo.
echo PRESS ONE TECLA PARA CONTINUAR PARA O PR├ôXIMO PASSO...
pause >nul
echo.
echo PASSO 3: Executar o Ambiente de Demonstracao
echo --------------------------------------------
echo.
echo Quando confirmar que o Docker est├í funcionando corretamente:
echo.
echo 1. Neste diret├│rio (e:\vscode\octoisp), execute o arquivo: run_demo.bat
echo 2. Aguarde alguns minutos enquanto os servi├ºos s├úo iniciados
echo 3. Acesse a plataforma em: http://localhost:8080
echo.
echo Credenciais de demonstra├º├úo:
echo   Usuario: demo@octoisp.local
echo   Senha: Demo123!@#
echo.
echo ###########################################################################
echo #                                                                         #
echo #    SIGA ESTES PASSOS PARA EXECUTAR O AMBIENTE DE DEMONSTRA├ç├âO OCTOISP    #
echo #                                                                         #
echo ###########################################################################
echo.
echo Pressione qualquer tecla para sair deste assistente...
pause >nul