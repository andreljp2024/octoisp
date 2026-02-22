const { Pool } = require('pg');

let connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL obrigatório em produção.');
  }
  connectionString = 'postgresql://octoisp:password@supabase-db-preview:5432/octoisp_preview';
}

const pool = new Pool({ connectionString });

const setAuthContext = async (client, userId) => {
  const claims = JSON.stringify({ sub: userId });
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId]);
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [claims]);
};

const withUser = async (userId, handler) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setAuthContext(client, userId);
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const queryAsUser = (userId, text, params = []) =>
  withUser(userId, (client) => client.query(text, params));

module.exports = {
  pool,
  withUser,
  queryAsUser
};
