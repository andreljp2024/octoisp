# Execução do Ambiente de Demonstração do OctoISP

Este guia explica como executar o ambiente de demonstração do OctoISP após a instalação do Docker.

## Antes de Começar

Certifique-se de que:

1. O Docker Desktop esteja instalado e em execução
2. O WSL 2 esteja configurado e funcionando
3. Todos os arquivos do projeto OctoISP estejam presentes

## Executar o Ambiente de Demonstração

### No Windows

Execute o script batch:

```
run_demo.bat
```

Este script irá:

1. Verificar se o Docker está instalado e em execução
2. Verificar se todos os arquivos necessários estão presentes
3. Iniciar todos os serviços do ambiente de demonstração
4. Exibir as informações de acesso

### No Linux/macOS

Execute o script bash:

```bash
chmod +x run_demo.sh
./run_demo.sh
```

## Acessar a Demonstração

Após a inicialização completa (leva cerca de 1-2 minutos), acesse:

[http://localhost:8080](http://localhost:8080)

Faça login com as seguintes credenciais:

- **E-mail**: `demo@octoisp.local`
- **Senha**: `Demo123!@#`

## Funcionalidades Disponíveis

No ambiente de demonstração, você poderá:

- Visualizar o dashboard NOC com dados simulados
- Navegar pelas seções de dispositivos, clientes e POPs
- Visualizar alertas simulados
- Acessar relatórios de demonstração
- Experimentar as ferramentas de rede
- Monitorar interfaces com dados simulados
- Usar ajuda contextual interativa por módulo

## Limitações do Ambiente de Demonstração

- Nenhuma operação de escrita é permitida
- Nenhuma configuração real é aplicada aos dispositivos
- O acesso é somente leitura para a maioria dos módulos
- Os dados são redefinidos a cada inicialização do ambiente

## Parar o Ambiente de Demonstração

Para parar o ambiente de demonstração, execute no terminal:

```bash
docker-compose -f docker-compose.preview.yml down
```

## Solução de Problemas

### Ambiente não responde

1. Verifique se o Docker Desktop está em execução
2. Verifique se todos os contêineres iniciaram corretamente:

```bash
docker-compose -f docker-compose.preview.yml ps
```

### Erros de conexão

1. Verifique se nenhuma outra aplicação está usando a porta 8080
2. Reinicie o Docker Desktop
3. Execute novamente o script de demonstração

### Demora excessiva para inicializar

A primeira inicialização pode levar mais tempo devido ao download das imagens Docker. Se demorar mais de 5 minutos, verifique os logs:

```bash
docker-compose -f docker-compose.preview.yml logs
```

## Informações Técnicas

O ambiente de demonstração inclui:

- Banco de dados PostgreSQL com dados de demonstração
- Serviços backend configurados em modo de demonstração
- Frontend PWA com marcações identificando o ambiente de demonstração
- Proxy reverso Nginx configurado para o ambiente de demonstração
- Todos os serviços isolados do ambiente de produção
