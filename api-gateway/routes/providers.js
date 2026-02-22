const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

const buildProvider = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  email: row.contact_email,
  phone: row.contact_phone,
  description: row.description,
  status: row.status || 'active',
  plan: row.plan_name,
  sla: row.sla_target,
  lastInvoice: row.last_invoice_date,
  totalCustomers: Number(row.customers_count || 0),
  totalDevices: Number(row.devices_count || 0),
  createdAt: row.created_at
});

// GET /api/providers - List providers (tenant scope)
router.get('/', requirePermission('providers.view'), async (req, res) => {
  try {
    const isGlobalAdmin = req.role === 'admin_global';
    const scope = req.query.scope;

    const result = await withUser(req.user.id, async (client) => {
      if (isGlobalAdmin && scope === 'all') {
        await client.query('SET LOCAL row_security = off');
        return client.query(
          `
            SELECT p.*,
                   (SELECT COUNT(*) FROM customers c WHERE c.provider_id = p.id) AS customers_count,
                   (SELECT COUNT(*) FROM devices d WHERE d.provider_id = p.id) AS devices_count
            FROM providers p
            ORDER BY p.created_at DESC
          `
        );
      }

      return client.query(
        `
          SELECT p.*,
                 (SELECT COUNT(*) FROM customers c WHERE c.provider_id = p.id) AS customers_count,
                 (SELECT COUNT(*) FROM devices d WHERE d.provider_id = p.id) AS devices_count
          FROM providers p
          WHERE p.id = $1
          LIMIT 1
        `,
        [req.tenantId]
      );
    });

    return res.json({
      providers: result.rows.map(buildProvider),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar provedor:', error);
    return res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /api/providers/:id - Get provider details
router.get('/:id', requirePermission('providers.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT p.*,
                 (SELECT COUNT(*) FROM customers c WHERE c.provider_id = p.id) AS customers_count,
                 (SELECT COUNT(*) FROM devices d WHERE d.provider_id = p.id) AS devices_count
          FROM providers p
          WHERE p.id = $1
          LIMIT 1
        `,
        [id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    return res.json(buildProvider(result.rows[0]));
  } catch (error) {
    console.error('Erro ao buscar provedor:', error);
    return res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// POST /api/providers - Create provider (admin)
router.post('/', requirePermission('providers.manage'), async (req, res) => {
  try {
    const payload = req.body || {};
    const name = payload.name;
    if (!name) {
      return res.status(400).json({ error: 'Nome do provedor é obrigatório.' });
    }

    const slug = payload.slug || name.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

    const result = await withUser(req.user.id, async (client) => {
      await client.query('SET LOCAL row_security = off');
      const created = await client.query(
        `
          INSERT INTO providers (
            name, slug, description, contact_email, contact_phone, status,
            plan_name, sla_target, last_invoice_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          RETURNING *
        `,
        [
          name,
          slug,
          payload.description || null,
          payload.email || payload.contactEmail || null,
          payload.phone || payload.contactPhone || null,
          payload.status || 'active',
          payload.plan || payload.planName || null,
          payload.sla || payload.slaTarget || null,
          payload.lastInvoice || payload.lastInvoiceDate || null
        ]
      );

      const roleRow = await client.query("SELECT id FROM roles WHERE name = 'admin_provider' LIMIT 1");
      if (roleRow.rowCount) {
        await client.query(
          `
            INSERT INTO user_provider_access (user_id, provider_id, role_id, granted_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, provider_id) DO NOTHING
          `,
          [req.user.id, created.rows[0].id, roleRow.rows[0].id]
        );
      }

      return created;
    });

    return res.status(201).json(buildProvider(result.rows[0]));
  } catch (error) {
    console.error('Erro ao criar provedor:', error);
    return res.status(500).json({ error: 'Failed to create provider' });
  }
});

// PUT /api/providers/:id - Update provider
router.put('/:id', requirePermission('providers.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const fields = [];
    const values = [];
    let idx = 1;

    const mapField = (column, value) => {
      if (value === undefined) return;
      fields.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    mapField('name', payload.name);
    mapField('slug', payload.slug);
    mapField('description', payload.description);
    mapField('contact_email', payload.email || payload.contactEmail);
    mapField('contact_phone', payload.phone || payload.contactPhone);
    mapField('status', payload.status);
    mapField('plan_name', payload.plan || payload.planName);
    mapField('sla_target', payload.sla || payload.slaTarget);
    mapField('last_invoice_date', payload.lastInvoice || payload.lastInvoiceDate);

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(id);
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE providers
          SET ${fields.join(', ')}, updated_at = NOW()
          WHERE id = $${idx}
          RETURNING *
        `,
        values
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    return res.json(buildProvider(result.rows[0]));
  } catch (error) {
    console.error('Erro ao atualizar provedor:', error);
    return res.status(500).json({ error: 'Failed to update provider' });
  }
});

// DELETE /api/providers/:id - Delete provider
router.delete('/:id', requirePermission('providers.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, async (client) => {
      await client.query('SET LOCAL row_security = off');
      return client.query('DELETE FROM providers WHERE id = $1 RETURNING id', [id]);
    });

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir provedor:', error);
    return res.status(500).json({ error: 'Failed to delete provider' });
  }
});

module.exports = router;
