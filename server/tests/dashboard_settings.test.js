import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Dashboard Statistics & Low-Stock Rules & Settings', () => {
  let authCookie;
  const orgEmail = `stats_owner_${Date.now()}@stockflow.test`;

  before(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Threshold Testing Co.',
        email: orgEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    authCookie = signupRes.headers['set-cookie'][0];

    // Seed 3 products:
    // Item A: qty 5, no custom threshold (inherits org default 5) -> 5 <= 5 => LOW STOCK
    await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Item A (Default Threshold)',
        sku: 'ITEM-A',
        quantityOnHand: 5,
        lowStockThreshold: null,
      });

    // Item B: qty 6, no custom threshold (inherits org default 5) -> 6 <= 5 is false => NOT LOW STOCK
    await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Item B (Default Threshold)',
        sku: 'ITEM-B',
        quantityOnHand: 6,
        lowStockThreshold: null,
      });

    // Item C: qty 8, custom threshold 10 -> 8 <= 10 => LOW STOCK (override org default 5!)
    await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Item C (Custom Threshold 10)',
        sku: 'ITEM-C',
        quantityOnHand: 8,
        lowStockThreshold: 10,
      });
  });

  it('18, 19, 20 & 21. Should correctly calculate dashboard statistics and apply threshold override', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    // Total products = 3
    assert.equal(res.body.totalProducts, 3);
    // Total units = 5 + 6 + 8 = 19
    assert.equal(res.body.totalUnits, 19);
    // Low stock count = Item A (5 <= 5) and Item C (8 <= 10) = 2 items
    assert.equal(res.body.lowStockCount, 2);
    assert.equal(res.body.lowStockProducts.length, 2);

    const lowStockSkus = res.body.lowStockProducts.map((p) => p.sku);
    assert.ok(lowStockSkus.includes('ITEM-A'));
    assert.ok(lowStockSkus.includes('ITEM-C'));
    assert.ok(!lowStockSkus.includes('ITEM-B'));
  });

  it('22 & 23. Changing organization default threshold should update low-stock status for un-customized items', async () => {
    // Increase default threshold from 5 to 7:
    // Now Item B (qty 6) without custom threshold inherits 7 -> 6 <= 7 => NOW LOW STOCK!
    const settingsUpdateRes = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie)
      .send({
        defaultLowStockThreshold: 7,
      });

    assert.equal(settingsUpdateRes.status, 200);
    assert.equal(settingsUpdateRes.body.settings.defaultLowStockThreshold, 7);

    // Verify persistence via GET /api/settings
    const getSettingsRes = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie);

    assert.equal(getSettingsRes.status, 200);
    assert.equal(getSettingsRes.body.settings.defaultLowStockThreshold, 7);

    // Re-check dashboard stats
    const dashboardRes = await request(app)
      .get('/api/dashboard')
      .set('Cookie', authCookie);

    assert.equal(dashboardRes.status, 200);
    // Now:
    // Item A (qty 5 <= 7) -> low stock
    // Item B (qty 6 <= 7) -> low stock (updated!)
    // Item C (qty 8 <= custom 10) -> low stock
    // Low stock count should now be 3!
    assert.equal(dashboardRes.body.lowStockCount, 3);
  });
});

