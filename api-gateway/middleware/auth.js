const jwt = require('jsonwebtoken');
const { withUser } = require('../db');

const isPreview = process.env.NODE_ENV === 'preview' || process.env.PREVIEW_MODE === 'true';
const demoUserId = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000000';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && !jwtSecret) {
  throw new Error('SUPABASE_JWT_SECRET obrigatório em produção.');
}

const decodeToken = (token) => {
  if (!token) return null;
  if (!jwtSecret) {
    return jwt.decode(token);
  }
  return jwt.verify(token, jwtSecret);
};

const loadUserContext = async (userId, requestedProviderId) =>
  withUser(userId, async (client) => {
    const access = await client.query(
      `
        SELECT upa.provider_id, upa.role_id, r.name AS role_name
        FROM user_provider_access upa
        JOIN roles r ON r.id = upa.role_id
        WHERE upa.user_id = $1
      `,
      [userId]
    );

    if (!access.rowCount) {
      return null;
    }

    const accessRow =
      requestedProviderId &&
      access.rows.find((row) => row.provider_id === requestedProviderId)
        ? access.rows.find((row) => row.provider_id === requestedProviderId)
        : access.rows[0];

    const roleName = accessRow.role_name;
    let permissionRows;

    if (['admin_global', 'admin_provider'].includes(roleName)) {
      permissionRows = await client.query('SELECT name FROM permissions');
    } else {
      permissionRows = await client.query(
        `
          SELECT DISTINCT p.name
          FROM permissions p
          JOIN role_permissions rp ON rp.permission_id = p.id
          WHERE rp.role_id = $1
          UNION
          SELECT p.name
          FROM permissions p
          JOIN user_permissions up ON up.permission_id = p.id
          WHERE up.user_id = $2
        `,
        [accessRow.role_id, userId]
      );
    }

    const userRow = await client.query(
      'SELECT id, email FROM auth.users WHERE id = $1',
      [userId]
    );

    const user = userRow.rows[0] || { id: userId, email: 'demo@octoisp.local' };

    return {
      user: {
        id: user.id,
        email: user.email,
        role: roleName,
        isAdmin: ['admin_global', 'admin_provider'].includes(roleName)
      },
      providerId: accessRow.provider_id,
      permissions: permissionRows.rows.map((row) => row.name),
      role: roleName
    };
  });

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const claims = decodeToken(token);
    let userId = claims?.sub || req.headers['x-user-id'];

    if (!jwtSecret && !isPreview && token) {
      return res.status(401).json({ error: 'Token inválido (sem chave JWT configurada).' });
    }

    if (!userId && isPreview) {
      userId = demoUserId;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const requestedProviderId = req.headers['x-provider-id'] || req.headers['x-tenant-id'];
    const context = await loadUserContext(userId, requestedProviderId);

    if (!context) {
      return res.status(403).json({ error: 'Sem acesso a provedor.' });
    }

    req.user = context.user;
    req.permissions = context.permissions;
    req.tenantId = context.providerId;
    req.role = context.role;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Falha ao autenticar.', detail: error.message });
  }
};

module.exports = authMiddleware;
