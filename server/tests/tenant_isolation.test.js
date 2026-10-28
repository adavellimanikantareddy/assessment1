import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Multi-Tenant Data Isolation (Highest Priority)', () => {
  let orgACookie;
  let orgBCookie;
  let productAId;
  let productBId;

  const orgAEmail = `tenant_a_${Date.now()}@alpha.test`;
  const orgBEmail = `tenant_b_${Date.now()}@beta.test`;

  before(async () => {
    // 1. Sign up Organization A
    const signupARes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Tenant Alpha Corp',
        email: orgAEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    orgACookie = signupARes.headers['set-cookie'][0];

    // 2. Sign up Organization B
    const signupBRes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Tenant Beta Inc',
        email: orgBEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    orgBCookie = signupBRes.headers['set-cookie'][0];

    // 3. Create a product in Org A
    const prodARes = await request(app)
      .post('/api/products')
      .set('Cookie', orgACookie)
      .send({
        name: 'Alpha Confidential Widget',
        sku: 'SHARED-SKU-99',
        quantityOnHand: 50,
      });
    productAId = prodARes.body.product.id;

    // 4. Create a product in Org B with the EXACT SAME SKU (verifying cross-org SKU collision is permitted)
    const prodBRes = await request(app)
      .post('/api/products')
      .set('Cookie', orgBCookie)
      .send({
        name: 'Beta Separate Gadget',
        sku: 'SHARED-SKU-99', // SAME SKU as Org A
        quantityOnHand: 10,
      });
    assert.equal(prodBRes.status, 201, 'Same SKU must be allowed across different organizations');
    productBId = prodBRes.body.product.id;
  });

  it('25. Organization A should only see its own products, and not Org B products', async () => {
    const resA = await request(app)
      .get('/api/products')
      .set('Cookie', orgACookie);

    assert.equal(resA.status, 200);
    const names = resA.body.products.map((p) => p.name);
    assert.ok(names.includes('Alpha Confidential Widget'));
    assert.ok(!names.includes('Beta Separate Gadget'));
  });

  it('25. Organization B should only see its own products, and not Org A products', async () => {
    const resB = await request(app)
      .get('/api/products')
      .set('Cookie', orgBCookie);

    assert.equal(resB.status, 200);
    const names = resB.body.products.map((p) => p.name);
    assert.ok(names.includes('Beta Separate Gadget'));
    assert.ok(!names.includes('Alpha Confidential Widget'));
  });

  it('26. Organization B cannot read Organization A product by ID (must return 404)', async () => {
    const res = await request(app)
      .get(`/api/products/${productAId}`)
      .set('Cookie', orgBCookie);

    // Strict isolation: Product is not found in Org B's scope
    assert.equal(res.status, 404);
  });

  it('27. Organization B cannot update Organization A product (must return 404)', async () => {
    const res = await request(app)
      .put(`/api/products/${productAId}`)
      .set('Cookie', orgBCookie)
      .send({
        name: 'Hacked by Tenant B',
        quantityOnHand: 9999,
      });

    assert.equal(res.status, 404);

    // Verify Org A product was NOT changed
    const checkRes = await request(app)
      .get(`/api/products/${productAId}`)
      .set('Cookie', orgACookie);

    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.body.product.name, 'Alpha Confidential Widget');
    assert.equal(checkRes.body.product.quantityOnHand, 50);
  });

  it('27. Organization B cannot delete Organization A product (must return 404)', async () => {
    const res = await request(app)
      .delete(`/api/products/${productAId}`)
      .set('Cookie', orgBCookie);

    assert.equal(res.status, 404);

    // Verify Org A product still exists
    const checkRes = await request(app)
      .get(`/api/products/${productAId}`)
      .set('Cookie', orgACookie);

    assert.equal(checkRes.status, 200);
  });

  it('28. Dashboard and settings calculations must be strictly isolated between tenants', async () => {
    const dashA = await request(app)
      .get('/api/dashboard')
      .set('Cookie', orgACookie);

    const dashB = await request(app)
      .get('/api/dashboard')
      .set('Cookie', orgBCookie);

    assert.equal(dashA.body.totalUnits, 50);
    assert.equal(dashB.body.totalUnits, 10);

    // Modify Org A's default threshold
    await request(app)
      .put('/api/settings')
      .set('Cookie', orgACookie)
      .send({ defaultLowStockThreshold: 12 });

    // Org B's threshold must remain unchanged at 5
    const settingsB = await request(app)
      .get('/api/settings')
      .set('Cookie', orgBCookie);

    assert.equal(settingsB.body.settings.defaultLowStockThreshold, 5);
  });
});

