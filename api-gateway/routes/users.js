const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

const roleLabels = {
  admin_global: 'Administrador Global',
  admin_provider: 'Administrador',
  noc_operator: 'NOC',
  technician: 'Técnico',
  viewer: 'Visualizador',
  demo_user: 'Demo'
};

const resolveRoleName = (role) => {
  if (!role) return 'viewer';
  const normalized = role.toString().toLowerCase();
  if (['admin', 'administrador'].includes(normalized)) return 'admin_provider';
  if (['noc', 'noc_operator', 'operador'].includes(normalized)) return 'noc_operator';
  if (['tecnico', 'técnico', 'technician'].includes(normalized)) return 'technician';
  if (['visualizador', 'viewer'].includes(normalized)) return 'viewer';
  if (['admin_global', 'admin_provider', 'noc_operator', 'technician', 'viewer', 'demo_user'].includes(normalized)) {
    return normalized;
  }
  return 'viewer';
};

const buildUserResponse = (user, permissions, providerId) => ({
  id: user.id,
  name: user.name || user.email?.split('@')[0] || 'Usuário OctoISP',
  email: user.email || 'demo@octoisp.local',
  role: user.role,
  roleLabel: roleLabels[user.role] || user.role,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  permissions,
  status: user.status || 'active',
  tenantId: providerId
});

// GET /api/users - List all users for provider
router.get('/', requirePermission('users.manage'), async (req, res) => {
  try {
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT u.id,
                 u.email,
                 r.name AS role_name,
                 upa.granted_at,
                 up.name AS profile_name,
                 up.phone AS profile_phone,
                 up.avatar_url AS profile_avatar,
                 up.status AS profile_status
          FROM auth.users u
          JOIN user_provider_access upa ON upa.user_id = u.id
          JOIN roles r ON r.id = upa.role_id
          LEFT JOIN user_profiles up ON up.user_id = u.id AND up.provider_id = upa.provider_id
          WHERE upa.provider_id = $1
          ORDER BY upa.granted_at DESC
        `,
        [req.tenantId]
      )
    );

    return res.json({
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.profile_name || row.email?.split('@')[0] || 'Usuário',
        email: row.email,
        role: row.role_name,
        roleLabel: roleLabels[row.role_name] || row.role_name,
        permissions: [],
        status: row.profile_status || 'active',
        phone: row.profile_phone,
        avatarUrl: row.profile_avatar,
        lastLogin: row.granted_at
      })),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT up.name, up.phone, up.avatar_url, up.status
          FROM user_profiles up
          WHERE up.user_id = $1 AND up.provider_id = $2
          LIMIT 1
        `,
        [req.user.id, req.tenantId]
      )
    );

    const profile = result.rows[0] || {};
    return res.json(
      buildUserResponse(
        {
          ...req.user,
          name: profile.name || req.user.name,
          phone: profile.phone,
          avatarUrl: profile.avatar_url,
          status: profile.status
        },
        req.permissions || [],
        req.tenantId
      )
    );
  } catch (error) {
    return res.json(
      buildUserResponse(req.user, req.permissions || [], req.tenantId)
    );
  }
});

// POST /api/users - Create new user (placeholder)
router.post('/', requirePermission('users.manage'), async (req, res) => {
  try {
    const payload = req.body || {};
    const email = payload.email;
    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const roleName = resolveRoleName(payload.role);
    const result = await withUser(req.user.id, async (client) => {
      const existing = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [email]);
      const userId = existing.rowCount
        ? existing.rows[0].id
        : (await client.query('INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), $1) RETURNING id, email', [email])).rows[0].id;

      const roleRow = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
      if (!roleRow.rowCount) {
        throw new Error('Role inválida.');
      }

      await client.query(
        `
          INSERT INTO user_provider_access (id, user_id, provider_id, role_id, granted_at)
          VALUES (gen_random_uuid(), $1, $2, $3, NOW())
          ON CONFLICT (user_id, provider_id)
          DO UPDATE SET role_id = EXCLUDED.role_id, granted_at = NOW()
        `,
        [userId, req.tenantId, roleRow.rows[0].id]
      );

      await client.query(
        `
          INSERT INTO user_profiles (user_id, provider_id, name, phone, avatar_url, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, provider_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            avatar_url = EXCLUDED.avatar_url,
            status = EXCLUDED.status,
            updated_at = NOW()
        `,
        [
          userId,
          req.tenantId,
          payload.name || email.split('@')[0],
          payload.phone || null,
          payload.avatarUrl || null,
          payload.status || 'active'
        ]
      );

      return { id: userId, email };
    });

    return res.status(201).json({
      id: result.id,
      email: result.email,
      name: payload.name,
      role: roleName,
      roleLabel: roleLabels[roleName] || roleName,
      status: payload.status || 'active',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Falha ao criar usuário.' });
  }
});

// PUT /api/users/me - Update current user profile
router.put('/me', async (req, res) => {
  try {
    const payload = req.body || {};
    await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO user_profiles (user_id, provider_id, name, phone, avatar_url, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, provider_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            avatar_url = EXCLUDED.avatar_url,
            status = EXCLUDED.status,
            updated_at = NOW()
        `,
        [
          req.user.id,
          req.tenantId,
          payload.name || null,
          payload.phone || null,
          payload.avatarUrl || null,
          payload.status || 'active'
        ]
      )
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Falha ao atualizar perfil.' });
  }
});

// PUT /api/users/:id - Update user role/profile
router.put('/:id', requirePermission('users.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const roleName = resolveRoleName(payload.role);

    await withUser(req.user.id, async (client) => {
      if (payload.role) {
        const roleRow = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
        if (roleRow.rowCount) {
          await client.query(
            `
              UPDATE user_provider_access
              SET role_id = $1
              WHERE user_id = $2 AND provider_id = $3
            `,
            [roleRow.rows[0].id, id, req.tenantId]
          );
        }
      }

      await client.query(
        `
          INSERT INTO user_profiles (user_id, provider_id, name, phone, avatar_url, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, provider_id)
          DO UPDATE SET
            name = COALESCE(EXCLUDED.name, user_profiles.name),
            phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
            avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
            status = COALESCE(EXCLUDED.status, user_profiles.status),
            updated_at = NOW()
        `,
        [
          id,
          req.tenantId,
          payload.name || null,
          payload.phone || null,
          payload.avatarUrl || null,
          payload.status || null
        ]
      );
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Falha ao atualizar usuário.' });
  }
});

// DELETE /api/users/:id - Remove user (placeholder)
router.delete('/:id', requirePermission('users.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    await withUser(req.user.id, async (client) => {
      await client.query('DELETE FROM user_profiles WHERE user_id = $1 AND provider_id = $2', [
        id,
        req.tenantId
      ]);
      await client.query('DELETE FROM user_provider_access WHERE user_id = $1 AND provider_id = $2', [id, req.tenantId]);
    });
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return res.status(500).json({ error: 'Falha ao remover usuário.' });
  }
});

module.exports = router;
