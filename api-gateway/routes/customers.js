const express = require('express');
const router = express.Router();
const { withUser } = require('../db');
const { requirePermission } = require('../middleware/requirePermission');

// GET /api/customers - List all customers
router.get('/', requirePermission('customers.view'), async (req, res) => {
  try {
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT c.*,
                 COUNT(d.id) AS devices_count
          FROM customers c
          LEFT JOIN devices d ON d.customer_id = c.id
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `
      )
    );

    return res.json({
      customers: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        country: row.country,
        plan: row.plan_name,
        lastBilling: row.last_billing_date,
        status: row.status,
        devices: Number(row.devices_count || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get customer details
router.get('/:id', requirePermission('customers.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          SELECT c.*,
                 COUNT(d.id) AS devices_count
          FROM customers c
          LEFT JOIN devices d ON d.customer_id = c.id
          WHERE c.id = $1
          GROUP BY c.id
          LIMIT 1
        `,
        [id]
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const row = result.rows[0];
    return res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      country: row.country,
      plan: row.plan_name,
      lastBilling: row.last_billing_date,
      status: row.status,
      devices: Number(row.devices_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers - Create new customer
router.post('/', requirePermission('customers.create'), async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          INSERT INTO customers (
            provider_id, pop_id, name, email, phone, address, city, country,
            plan_name, last_billing_date, contract_start_date, contract_end_date, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          RETURNING *
        `,
        [
          req.tenantId,
          payload.popId || null,
          payload.name,
          payload.email || null,
          payload.phone || null,
          payload.address || null,
          payload.city || null,
          payload.country || 'Brasil',
          payload.plan || payload.planName || null,
          payload.lastBilling || payload.lastBillingDate || null,
          payload.contractStartDate || null,
          payload.contractEndDate || null,
          payload.status || 'active'
        ]
      )
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', requirePermission('customers.edit'), async (req, res) => {
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

    mapField('pop_id', payload.popId);
    mapField('name', payload.name);
    mapField('email', payload.email);
    mapField('phone', payload.phone);
    mapField('address', payload.address);
    mapField('city', payload.city);
    mapField('country', payload.country);
    mapField('plan_name', payload.plan || payload.planName);
    mapField('last_billing_date', payload.lastBilling || payload.lastBillingDate);
    mapField('contract_start_date', payload.contractStartDate);
    mapField('contract_end_date', payload.contractEndDate);
    mapField('status', payload.status);

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(id);
    const result = await withUser(req.user.id, (client) =>
      client.query(
        `
          UPDATE customers
          SET ${fields.join(', ')}, updated_at = NOW()
          WHERE id = $${idx}
          RETURNING *
        `,
        values
      )
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', requirePermission('customers.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await withUser(req.user.id, (client) =>
      client.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id])
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
