const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para provisionar o usuário de demonstração no sistema OctoISP
 * Este script cria um usuário demo no Supabase Auth e associa ao provedor de demonstração
 */

async function provisionDemoUser() {
  // Configurações do Supabase
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:5433'; // URL do Supabase local
  const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service_role_key';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Provisionando usuário de demonstração...');

  try {
    // Dados do usuário demo
    const demoUserData = {
      email: 'demo@octoisp.local',
      password: 'Demo123!@#',
      user_metadata: {
        fullName: 'Usuário Demo',
        role: 'demo',
        tenant: 'provedor-demo'
      }
    };

    // Criação do usuário no Supabase Auth
    console.log('Criando usuário no Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: demoUserData.email,
      password: demoUserData.password,
      user_metadata: demoUserData.user_metadata,
      email_confirm: true  // Confirma o e-mail automaticamente
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
    }

    console.log(`Usuário demo criado com ID: ${authUser.user.id}`);

    // Agora precisamos associar esse usuário ao provedor de demonstração
    // Primeiro, obtemos o ID do provedor de demonstração
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', 'provedor-demo')
      .single();

    if (providerError) {
      throw new Error(`Erro ao buscar provedor de demonstração: ${providerError.message}`);
    }

    // Depois, obtemos o ID do papel de demo
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'demo_user')
      .single();

    if (roleError) {
      throw new Error(`Erro ao buscar papel de demo: ${roleError.message}`);
    }

    // Finalmente, associamos o usuário ao provedor com o papel correto
    const { error: associationError } = await supabase
      .from('user_provider_access')
      .insert({
        user_id: authUser.user.id,
        provider_id: provider.id,
        role_id: role.id,
        granted_at: new Date().toISOString()
      });

    if (associationError) {
      throw new Error(`Erro ao associar usuário ao provedor: ${associationError.message}`);
    }

    console.log('Usuário demo associado ao provedor de demonstração com sucesso!');

    // Criar um registro no log de auditoria
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        user_id: authUser.user.id, // O ID do usuário que executou a ação (neste caso, o próprio usuário sendo criado)
        provider_id: provider.id,
        action: 'demo_user_created',
        resource_type: 'user',
        resource_id: authUser.user.id,
        ip_address: '127.0.0.1', // IP local para demonstração
        user_agent: 'OctoISP Demo Setup Script',
        metadata: {
          email: demoUserData.email,
          full_name: demoUserData.user_metadata.fullName
        }
      });

    if (auditError) {
      console.warn(`Aviso: Erro ao registrar no log de auditoria: ${auditError.message}`);
    } else {
      console.log('Registro de auditoria criado para o usuário demo.');
    }

    console.log('\n=========================================');
    console.log('USUÁRIO DE DEMONSTRAÇÃO CRIADO COM SUCESSO!');
    console.log('=========================================');
    console.log(`E-mail: ${demoUserData.email}`);
    console.log('Senha: Demo123!@# (alterar após o primeiro acesso)');
    console.log('Função: Acesso de demonstração limitado');
    console.log('Provedor: Provedor Demo Ltda');
    console.log('=========================================');

    return {
      userId: authUser.user.id,
      email: demoUserData.email,
      password: demoUserData.password
    };
  } catch (error) {
    console.error('Erro ao provisionar usuário de demonstração:', error.message);
    throw error;
  }
}

// Executar o script se chamado diretamente
if (require.main === module) {
  provisionDemoUser()
    .then(result => {
      console.log('\nProvisionamento concluído com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nFalha no provisionamento:', error.message);
      process.exit(1);
    });
}

module.exports = { provisionDemoUser };