-- Script para configurar o ambiente de demonstração do OctoISP
-- Este script cria um provedor de demonstração, usuário demo e configura permissões

-- 1. Criar provedor de demonstração
INSERT INTO providers (id, name, slug, description, contact_email, contact_phone, status, plan_name, sla_target, last_invoice_date) 
VALUES (
    gen_random_uuid(),
    'Provedor Demo Ltda',
    'provedor-demo',
    'Ambiente de demonstração do OctoISP',
    'demo@octoisp.local',
    '+55 11 99999-9999',
    'active',
    'Enterprise',
    '99,9%',
    CURRENT_DATE - INTERVAL '10 days'
) RETURNING id AS provider_demo_id \gset

-- 2. Criar papel de demonstração com permissões limitadas
INSERT INTO roles (id, name, description, is_system_role) 
VALUES (
    gen_random_uuid(),
    'demo_user',
    'Usuário de demonstração com acesso limitado',
    false
) RETURNING id AS demo_role_id \gset

-- 3. Associar permissões limitadas ao papel de demonstração
-- Permitir apenas visualização de alguns módulos
WITH demo_role AS (
    SELECT id FROM roles WHERE name = 'demo_user'
),
allowed_permissions AS (
    SELECT id FROM permissions
)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    dr.id,
    ap.id,
    NOW()
FROM demo_role dr, allowed_permissions ap
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Criar usuário no Supabase Auth (isso normalmente seria feito via API do Supabase)
-- Como estamos num ambiente de desenvolvimento, vamos simular o ID do usuário
-- Em produção, o usuário seria criado via Supabase Auth e o ID obtido automaticamente
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@octoisp.local')
ON CONFLICT (id) DO NOTHING;

-- 5. Associar o usuário demo ao provedor de demonstração com o papel de demo
-- Assumindo que o ID do usuário demo será armazenado como uma constante para fins de demonstração
INSERT INTO user_provider_access (id, user_id, provider_id, role_id, granted_at)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000', -- Este ID será substituído no ambiente real com o ID do usuário real
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    (SELECT id FROM roles WHERE name = 'demo_user'),
    NOW()
);

-- Perfil do usuário demo
INSERT INTO user_profiles (user_id, provider_id, name, phone, avatar_url, status)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    'Administrador Demo',
    '+55 11 99999-0000',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'active'
)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Criar POP de demonstração
INSERT INTO pops (id, provider_id, name, slug, address, city, country, latitude, longitude, status, uplink_capacity, utilization_percent, latency_ms)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    'POP Central Demo',
    'pop-central-demo',
    'Rua Demo, 123',
    'São Paulo',
    'Brasil',
    -23.550520,
    -46.633309,
    'active',
    '2x 10Gb',
    62.5,
    9.4
;

-- 7. Criar clientes de demonstração
INSERT INTO customers (id, provider_id, pop_id, name, email, phone, address, city, country, plan_name, last_billing_date, status)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    (SELECT id FROM pops WHERE slug = 'pop-central-demo'),
    'Cliente Demo ' || generate_series(1, 10),
    'cliente' || generate_series(1, 10) || '@demo.local',
    '+55 11 98888-7777',
    'Rua Demo ' || generate_series(1, 10),
    'São Paulo',
    'Brasil',
    CASE 
        WHEN generate_series(1, 10) % 3 = 0 THEN 'Fibra 500Mbps'
        WHEN generate_series(1, 10) % 3 = 1 THEN 'Fibra 300Mbps'
        ELSE 'Fibra 1Gbps'
    END,
    CURRENT_DATE - (generate_series(1, 10) || ' days')::interval,
    'active'
;

-- 8. Criar dispositivos de demonstração
INSERT INTO devices (id, provider_id, customer_id, pop_id, serial_number, oui, product_class, software_version, hardware_version, wan_ip, lan_ip, vendor, model, status, connection_type, device_type)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    (SELECT id FROM customers ORDER BY created_at LIMIT 1 OFFSET s.i-1),
    (SELECT id FROM pops WHERE slug = 'pop-central-demo'),
    'DEMO' || LPAD(s.i::text, 6, '0'),
    CASE 
        WHEN s.i % 3 = 0 THEN '001EC'
        WHEN s.i % 3 = 1 THEN '001BC'
        ELSE '086266'
    END,
    CASE 
        WHEN s.i % 3 = 0 THEN 'MikroTik RouterBOARD'
        WHEN s.i % 3 = 1 THEN 'Huawei HG658'
        ELSE 'UBNT Edgerouter'
    END,
    'v' || (s.i % 5 + 1)::text || '.' || (s.i % 10 + 10)::text || '.1',
    'hw-v' || (s.i % 3 + 1)::text,
    ('192.168.100.' || (s.i + 10))::inet,
    ('10.0.0.' || (s.i + 20))::inet,
    CASE 
        WHEN s.i % 3 = 0 THEN 'MikroTik'
        WHEN s.i % 3 = 1 THEN 'Huawei'
        ELSE 'Ubiquiti'
    END,
    CASE 
        WHEN s.i % 3 = 0 THEN 'hAP ac lite'
        WHEN s.i % 3 = 1 THEN 'HG658'
        ELSE 'ER-4'
    END,
    CASE 
        WHEN s.i % 2 = 0 THEN 'online'
        ELSE 'offline'
    END,
    'ethernet',
    'cpe'
FROM generate_series(1, 20) AS s(i);

-- 9. Criar alguns alertas de demonstração
INSERT INTO alerts (id, provider_id, device_id, customer_id, pop_id, alert_type, severity, title, description, status, priority, created_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    (SELECT id FROM devices ORDER BY created_at LIMIT 1 OFFSET a.i-1),
    (SELECT customer_id FROM devices WHERE id = (SELECT id FROM devices ORDER BY created_at LIMIT 1 OFFSET a.i-1)),
    (SELECT pop_id FROM devices WHERE id = (SELECT id FROM devices ORDER BY created_at LIMIT 1 OFFSET a.i-1)),
    CASE 
        WHEN a.i % 4 = 0 THEN 'device_offline'
        WHEN a.i % 4 = 1 THEN 'high_cpu'
        WHEN a.i % 4 = 2 THEN 'bandwidth_threshold'
        ELSE 'temperature_warning'
    END,
    CASE 
        WHEN a.i % 3 = 0 THEN 'critical'
        WHEN a.i % 3 = 1 THEN 'warning'
        ELSE 'info'
    END,
    CASE 
        WHEN a.i % 4 = 0 THEN 'Dispositivo offline'
        WHEN a.i % 4 = 1 THEN 'Alta utilização de CPU'
        WHEN a.i % 4 = 2 THEN 'Limite de banda atingido'
        ELSE 'Aviso de temperatura'
    END,
    CASE 
        WHEN a.i % 4 = 0 THEN 'O dispositivo DEMO' || LPAD((a.i-1)::text, 6, '0') || ' está offline há mais de 5 minutos'
        WHEN a.i % 4 = 1 THEN 'CPU do dispositivo DEMO' || LPAD((a.i-1)::text, 6, '0') || ' está acima de 80%'
        WHEN a.i % 4 = 2 THEN 'Banda do dispositivo DEMO' || LPAD((a.i-1)::text, 6, '0') || ' atingiu 90% da capacidade'
        ELSE 'Temperatura do dispositivo DEMO' || LPAD((a.i-1)::text, 6, '0') || ' está acima do normal'
    END,
    CASE 
        WHEN a.i % 5 = 0 THEN 'closed'
        WHEN a.i % 5 = 1 THEN 'resolved'
        WHEN a.i % 5 = 2 THEN 'acknowledged'
        ELSE 'open'
    END,
    CASE 
        WHEN a.i % 3 = 0 THEN 1
        WHEN a.i % 3 = 1 THEN 0
        ELSE -1
    END,
    NOW() - INTERVAL '1 hour' * a.i
FROM generate_series(1, 15) AS a(i);

-- 10. Criar template TR-069 de demonstração
INSERT INTO tr069_templates (id, provider_id, name, description, vendor, model, parameters)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM providers WHERE slug = 'provedor-demo'),
    'Template Demo Básico',
    'Template básico de demonstração para todos os dispositivos',
    NULL,  -- Aplica a todos os vendors
    NULL,  -- Aplica a todos os modelos
    '{"InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID": "WIFI_DEMO", "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase": "senha_demo_segura"}'::jsonb;
