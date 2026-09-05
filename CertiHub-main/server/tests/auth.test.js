const request = require('supertest');
const app = require('../server');

describe('API Security Tests', () => {
  test('POST /api/analyze should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({});
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/admin/stats should return 401 without token', async () => {
    const res = await request(app)
      .get('/api/admin/stats');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/share/:id should be public (return 200/404)', async () => {
    const res = await request(app)
      .get('/api/share/test-id');
    // It might return 404 because the ID doesn't exist, but it shouldn't be 401
    expect(res.statusCode).not.toBe(401);
  });
});
