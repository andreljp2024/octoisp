# Provisionamento do Usuário de Demonstração no OctoISP

## Visão Geral

Este documento detalha o processo de criação e configuração do usuário de demonstração no ambiente OctoISP, explicando todos os passos envolvidos no provisionamento.

## Processo de Provisionamento

### 1. Criação do Usuário no Supabase Auth

O primeiro passo é criar o usuário no sistema de autenticação do Supabase:

```javascript
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: 'demo@octoisp.local',
  password: 'Demo123!@#',
  user_metadata: {
    fullName: 'Usuário Demo',
    role: 'demo',
    tenant: 'provedor-demo'
  },
  email_confirm: true  // Confirma o e-mail automaticamente
});
```

### 2. Associação ao Provedor de Demonstração

Após a criação do usuário, ele precisa ser associado ao provedor de demonstração:

```sql
INSERT INTO user_provider_access (user_id, provider_id, role_id, granted_at)
VALUES (
  'user_id_retornado_do_supabase',
  (SELECT id FROM providers WHERE slug = 'provedor-demo'),
  (SELECT id FROM roles WHERE name = 'demo_user'),
  NOW()
);
```

### 3. Configuração de Permissões

O usuário de demonstração recebe um papel (`role`) específico com permissões limitadas:

- Permissão de visualização para dashboard
- Permissão de visualização para dispositivos
- Permissão de visualização para clientes
- Permissão de visualização para alertas
- Permissão de visualização para relatórios

### 4. Registro de Auditoria

Todas as ações no sistema são registradas para auditoria:

```sql
INSERT INTO audit_log (user_id, provider_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
VALUES (
  'user_id',
  'provider_id',
  'demo_user_created',
  'user',
  'user_id',
  '127.0.0.1',
  'OctoISP Demo Setup Script',
  '{ "email": "demo@octoisp.local", "full_name": "Usuário Demo" }'
);
```

## Permissões do Usuário de Demonstração

O papel `demo_user` tem as seguintes permissões:

| Módulo | Ações Permitidas |
|--------|------------------|
| Dashboard | Visualização |
| Dispositivos | Visualização |
| Clientes | Visualização |
| Alertas | Visualização |
| Relatórios | Visualização |

## Restrições do Usuário de Demonstração

O usuário de demonstração tem as seguintes restrições:

- Nenhuma permissão de escrita
- Nenhuma permissão para provisionar dispositivos
- Nenhuma permissão para gerenciar usuários
- Nenhuma permissão para alterar configurações
- Acesso limitado a dados de demonstração

## Ambiente de Demonstração

O usuário de demonstração opera exclusivamente no ambiente de demonstração, que:

- Usa dados simulados
- Não afeta sistemas de produção
- Tem todos os dados redefinidos periodicamente
- Não persiste alterações feitas pelos usuários

## Segurança

- A senha do usuário de demonstração é pública e conhecida
- O ambiente não contém dados reais
- O acesso é restrito a fins de demonstração
- Nenhuma integração com sistemas externos está ativada

## Considerações Finais

O provisionamento do usuário de demonstração é um processo automatizado que:

1. Cria o usuário no sistema de autenticação
2. Associa-o ao provedor de demonstração
3. Atribui as permissões corretas
4. Registra a ação para auditoria
5. Garante que o acesso seja seguro e limitado

Este processo garante que os interessados possam experimentar a plataforma de forma segura, sem riscos para dados reais ou sistemas de produção.