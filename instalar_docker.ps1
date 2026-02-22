Write-Host "=========================================" -ForegroundColor Green
Write-Host "Instalação do Docker Desktop para OctoISP" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`nO OctoISP requer o Docker Desktop para executar o ambiente de demonstração.`n" -ForegroundColor Yellow

$confirm = Read-Host "Deseja abrir a página de download do Docker Desktop? (S/N)"

if ($confirm -eq 'S' -or $confirm -eq 's') {
    Write-Host "`nAbrindo a página de download do Docker Desktop..." -ForegroundColor Cyan
    Start-Process "https://www.docker.com/products/docker-desktop"
    
    Write-Host "`nInstruções:" -ForegroundColor White
    Write-Host "1. Baixe o instalador para Windows" -ForegroundColor White
    Write-Host "2. Execute o instalador como administrador" -ForegroundColor White
    Write-Host "3. Durante a instalação, certifique-se de:" -ForegroundColor White
    Write-Host "   - Habilitar o WSL 2 Integration (já instalado no sistema)" -ForegroundColor White
    Write-Host "   - Habilitar o uso de recursos necessários" -ForegroundColor White
    Write-Host "4. Reinicie seu computador após a instalação" -ForegroundColor White
    Write-Host "5. Inicie o Docker Desktop e aguarde o ícone na bandeja ficar verde" -ForegroundColor White
    
    $started = Read-Host "`nDocker Desktop já foi instalado e iniciado? (S/N)"
    
    if ($started -eq 'S' -or $started -eq 's') {
        Write-Host "`nVerificando se o Docker está funcionando..." -ForegroundColor Cyan
        
        try {
            $dockerVersion = docker --version 2>&1
            $composeVersion = docker-compose --version 2>&1
            
            if (Test-DockerInstallation) {
                Write-Host "✓ Docker está instalado e funcionando: $dockerVersion" -ForegroundColor Green
                
                $confirmRun = Read-Host "`nDeseja iniciar o ambiente de demonstração do OctoISP? (S/N)"
                
                if ($confirmRun -eq 'S' -or $confirmRun -eq 's') {
                    Write-Host "`nIniciando o ambiente de demonstração do OctoISP..." -ForegroundColor Cyan
                                    
                    # Tentar executar o demo e verificar se o arquivo existe
                    if (Test-Path "run_demo.bat") {
                        Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "run_demo.bat"
                    } else {
                        Write-Error "O arquivo run_demo.bat não foi encontrado no diretório atual."
                        Write-Host "Por favor, verifique se você está no diretório correto do projeto." -ForegroundColor Red
                    }
                    
                    Write-Host "`nO ambiente de demonstração está sendo iniciado!" -ForegroundColor Green
                    Write-Host "Acesse a plataforma em: http://localhost:8080" -ForegroundColor Green
                    Write-Host "Credenciais de demonstração:" -ForegroundColor Green
                    Write-Host "  Usuário: demo@octoisp.local" -ForegroundColor Green
                    Write-Host "  Senha: Demo123!@#" -ForegroundColor Green
                } else {
                    Write-Host "`nQuando quiser executar a demonstração, use o comando:" -ForegroundColor Cyan
                    Write-Host "  run_demo.bat" -ForegroundColor Cyan
                }
            } else {
                Write-Host "✗ O Docker não parece estar funcionando corretamente." -ForegroundColor Red
                Write-Host "Por favor, verifique se o Docker Desktop está em execução." -ForegroundColor Red
            }
        } catch {
            Write-Host "✗ O Docker não está instalado ou não está no PATH." -ForegroundColor Red
            Write-Host "Certifique-se de que o Docker Desktop foi instalado corretamente." -ForegroundColor Red
        }
    } else {
        Write-Host "`nApós instalar e iniciar o Docker Desktop, execute este script novamente." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nVocê pode baixar o Docker Desktop em: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
}

# Verificar se o usuário deseja continuar com outras tarefas
$exitConfirm = Read-Host "`nDeseja finalizar o assistente de instalação? (S/N)"
if ($exitConfirm -ne 'S' -and $exitConfirm -ne 's') {
    Write-Host "`nRetornando ao menu principal..." -ForegroundColor Cyan
    # Aqui poderia ser adicionada uma lógica para retornar a um menu principal ou reiniciar o fluxo
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "Fim do assistente de instalação" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green