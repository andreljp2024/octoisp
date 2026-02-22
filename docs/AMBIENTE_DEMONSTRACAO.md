# Ambiente de Demonstração do OctoISP

## Visão Geral

O ambiente de demonstração do OctoISP permite que interessados experimentem a plataforma com um conjunto limitado de recursos e dados, sem afetar nenhum ambiente de produção.

## Recursos Disponíveis no Ambiente de Demonstração

- Dashboard NOC com dados simulados
- Visualização de dispositivos (20 dispositivos simulados)
- Visualização de clientes (10 clientes simulados)
- Visualização de alertas (15 alertas simulados)
- Visualização de POPs (1 POP simulado)
- Acesso limitado a relatórios
- Demonstração de ferramentas de rede
- Monitoramento de interfaces com dados simulados
- Ajuda contextual interativa por módulo

## Restrições do Ambiente de Demonstração

- Nenhuma operação de escrita é permitida
- Nenhuma alteração real é feita nos dispositivos
- Nenhuma configuração é aplicada a dispositivos reais
- Acesso somente leitura a maioria dos módulos
- Nenhuma integração com serviços externos ativa

## Acesso ao Ambiente de Demonstração

### Credenciais

- **E-mail:** `demo@octoisp.local`
- **Senha:** `Demo123!@#`

### Endereço de Acesso

- **URL:** `http://localhost:8080`

## Como Iniciar o Ambiente de Demonstração

### Pré-requisitos

- Docker e Docker Compose instalados
- Pelo menos 4GB de RAM disponíveis
- 5GB de espaço em disco

### Passos para Inicialização

1. Execute o script de inicialização:
   ```bash
   chmod +x init_demo_env.sh
   ./init_demo_env.sh
   ```

2. Aguarde a inicialização completa dos serviços (cerca de 1 minuto)

3. Acesse a plataforma no navegador: `http://localhost:8080`

4. Faça login com as credenciais de demonstração
5. Explore a ajuda contextual pelo ícone de ajuda no topo da interface

### Scripts Importantes

- `init_demo_env.sh` - Inicia o ambiente de demonstração
- `provision_demo_user.js` - Script para criar o usuário demo (executado automaticamente na inicialização)

## Dados de Demonstração

O ambiente de demonstração inclui:

- 1 Provedor de demonstração
- 1 POP de demonstração
- 10 Clientes de demonstração
- 20 Dispositivos de demonstração (CPEs e ONTs)
- 15 Alertas de demonstração em diferentes estados
- 1 Template TR-069 de demonstração

## Limitações Técnicas

- O ambiente de demonstração roda localmente
- Os dados são redefinidos a cada inicialização
- Não há persistência de alterações (somente leitura)
- Alguns recursos avançados podem estar desabilitados

## Encerramento do Ambiente

Para encerrar o ambiente de demonstração:

```bash
docker-compose -f docker-compose.preview.yml down
```

## Ambiente de Preview Antes da Produção

Antes de implantar em produção, o ambiente de preview permite:

- Testar novas funcionalidades
- Validar configurações de rede
- Treinar equipe com dados simulados
- Demonstrar recursos para stakeholders

### Diferenças para Produção

- Menor quantidade de dados
- Nenhuma integração com sistemas externos
- Recursos de provisionamento desabilitados
- Limite de usuários simultâneos
- Não representa o desempenho real em produção

## Solução de Problemas

### Se a aplicação não carregar

1. Verifique se todos os serviços estão ativos:
   ```bash
   docker-compose -f docker-compose.preview.yml ps
   ```

2. Verifique os logs:
   ```bash
   docker-compose -f docker-compose.preview.yml logs
   ```

### Se não conseguir fazer login

1. Verifique se o banco de dados foi populado corretamente
2. Confirme que o usuário demo foi criado
3. Tente reiniciar o ambiente

## Segurança

- As credenciais de demonstração são públicas e não devem ser usadas em produção
- O ambiente não deve ser exposto publicamente
- Todos os dados são simulados e não contêm informações reais
- O ambiente não deve conter informações sensíveis de clientes reais

## Feedback

Se encontrar problemas ou tiver sugestões para melhorar o ambiente de demonstração, por favor registre um issue no repositório do projeto.
