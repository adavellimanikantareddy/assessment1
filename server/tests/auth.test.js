import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication & Session Flow', () => {
  const testEmail = `auth_test_${Date.now()}@stockflow.test`;
  const password = 'SecretPassword123';
  let authCookie;

  it('1 & 2. Should sign up a new user and create an organization', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Alpha Supply Labs',
        email: testEmail,
        password: password,
        confirmPassword: password,
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.organization.name, 'Alpha Supply Labs');
    assert.equal(res.body.user.organization.defaultLowStockThreshold, 5);

    // Verify auth cookie is set
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    authCookie = cookies[0];
    assert.match(authCookie, /stockflow_token=/);
  });

  it('3. Should reject duplicate email registration with 409', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Duplicate Corp',
        email: testEmail,
        password: password,
        confirmPassword: password,
      });

    assert.equal(res.status, 409);
    assert.match(res.body.error, /already exists/i);
  });

  it('4. Should allow login with correct credentials and issue cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: password,
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.user);
    assert.equal(res.body.user.email, testEmail);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    authCookie = cookies[0];
  });

  it('5. Should reject login with incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword',
      });

    assert.equal(res.status, 401);
    assert.match(res.body.error, /invalid email or password/i);
  });

  it('6. Should return current user on /api/auth/me when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.organization.name, 'Alpha Supply Labs');
  });

  it('7. Should reject unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/products');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Authentication required/i);
  });

  it('8. Should clear session cookie on logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    // Cookie should be cleared (max-age 0 or expires in past)
    assert.match(cookies[0], /stockflow_token=;/);
  });
});

