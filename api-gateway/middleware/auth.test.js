const jwt = require('jsonwebtoken');

const userId = '11111111-1111-4111-8111-111111111111';
const providerId = '22222222-2222-4222-8222-222222222222';

const buildResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('authentication middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_JWT_SECRET = 'test-secret-that-is-long-enough-for-unit-tests';
    jest.doMock('../db', () => ({
      withUser: jest.fn(async (_id, handler) =>
        handler({
          query: jest.fn(async (text) => {
            if (text.includes('FROM user_provider_access')) {
              return {
                rowCount: 1,
                rows: [{ provider_id: providerId, role_id: 'role-1', role_name: 'admin_global' }],
              };
            }
            if (text.includes('SELECT name FROM permissions')) {
              return { rows: [{ name: 'reports.view' }] };
            }
            return { rows: [{ id: userId, email: 'admin@example.test' }] };
          }),
        })
      ),
    }));
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  test('rejects an unsigned X-User-ID identity in production', async () => {
    const middleware = require('./auth');
    const req = { headers: { 'x-user-id': userId } };
    const res = buildResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts a valid signed JWT and loads tenant context', async () => {
    const middleware = require('./auth');
    const token = jwt.sign({ sub: userId }, process.env.SUPABASE_JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe(userId);
    expect(req.tenantId).toBe(providerId);
  });
});
