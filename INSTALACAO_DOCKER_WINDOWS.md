# Instalação do Docker Desktop no Windows

Para executar o ambiente de demonstração do OctoISP, é necessário ter o Docker Desktop instalado no seu sistema Windows.

## Requisitos do Sistema

- Windows 10 64-bit: versão 2004 (build 19041) ou superior ou Windows 11
- WSL 2 ou Hyper-V e Containers recursos do Windows ativados
- 4GB de RAM mínimo
- BIOS-level virtualization deve estar ativado nas configurações do BIOS

## Passos para Instalação

### 1. Baixar o Docker Desktop

Acesse o site oficial do Docker e faça o download da versão mais recente para Windows:

[https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

### 2. Instalar o Docker Desktop

1. Execute o instalador baixado como administrador
2. Siga o assistente de instalação
3. Durante a instalação, o Docker Desktop ativará automaticamente os recursos necessários do Windows

### 3. Reiniciar o Computador

Após a instalação, reinicie seu computador para que todas as alterações tenham efeito.

### 4. Iniciar o Docker Desktop

1. Após reiniciar, inicie o Docker Desktop
2. Aguarde até que o status indique que o Docker está em execução (ícone de uma engrenagem verde na bandeja do sistema)

### 5. Verificar a Instalação

Execute os seguintes comandos no PowerShell para verificar se o Docker está funcionando corretamente:

```powershell
docker --version
docker-compose --version
```

Se ambos os comandos retornarem as respectivas versões, o Docker está instalado e configurado corretamente.

## Executar o Ambiente de Demonstração do OctoISP

Após instalar e configurar o Docker Desktop, você poderá executar o ambiente de demonstração do OctoISP com o seguinte comando:

```
run_demo.bat
```

## Solução de Problemas Comuns

### WSL 2 Backend não está habilitado

Se encontrar um erro relacionado ao WSL 2:

1. Abra o PowerShell como administrador
2. Execute: `wsl --set-default-version 2`
3. Reinicie o Docker Desktop

### Recursos do Windows não estão habilitados

Se o Docker Desktop não iniciar, habilite manualmente os recursos do Windows:

1. Abra o Painel de Controle
2. Vá para "Programas" > "Ativar ou desativar recursos do Windows"
3. Habilite as seguintes opções:
   - Plataforma de Máquina Virtual
   - Subsistema do Windows para Linux
   - Containers do Windows (opcional)
   - Hyper-V (opcional, se disponível)

Após ativar esses recursos, reinicie o computador e tente iniciar o Docker Desktop novamente.

## Observações

- O ambiente de demonstração do OctoISP utiliza diversos serviços Docker e pode exigir recursos significativos do sistema
- Recomenda-se ter pelo menos 8GB de RAM disponível para uma experiência ideal
- O primeiro início do ambiente de demonstração pode levar alguns minutos enquanto todos os serviços são iniciados