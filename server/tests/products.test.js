import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Product Management CRUD & Validation', () => {
  let authCookie;
  let createdProductId;
  const orgEmail = `prod_owner_${Date.now()}@stockflow.test`;

  before(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        organizationName: 'Logistics Beta',
        email: orgEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    authCookie = signupRes.headers['set-cookie'][0];
  });

  it('8. Should successfully create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Ergonomic Keyboard',
        sku: 'KB-ERGO-01',
        description: 'Split mechanical keyboard',
        quantityOnHand: 15,
        costPrice: 45.0,
        sellingPrice: 89.99,
        lowStockThreshold: 4,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.product.name, 'Ergonomic Keyboard');
    assert.equal(res.body.product.sku, 'KB-ERGO-01');
    assert.equal(res.body.product.quantityOnHand, 15);
    assert.equal(res.body.product.effectiveThreshold, 4);
    assert.equal(res.body.product.isLowStock, false);

    createdProductId = res.body.product.id;
  });

  it('9. Should retrieve the created product in the products list', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.products));
    const found = res.body.products.find((p) => p.id === createdProductId);
    assert.ok(found);
    assert.equal(found.sku, 'KB-ERGO-01');
  });

  it('10. Should search products by name', async () => {
    const res = await request(app)
      .get('/api/products?search=Ergonomic')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.products.length, 1);
    assert.equal(res.body.products[0].id, createdProductId);
  });

  it('11. Should search products by SKU', async () => {
    const res = await request(app)
      .get('/api/products?search=KB-ERGO')
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.products.length, 1);
    assert.equal(res.body.products[0].sku, 'KB-ERGO-01');
  });

  it('12 & 13. Should edit product details and update stock quantity', async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set('Cookie', authCookie)
      .send({
        name: 'Ergonomic Keyboard Pro',
        quantityOnHand: 2, // low stock! threshold is 4
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.product.name, 'Ergonomic Keyboard Pro');
    assert.equal(res.body.product.quantityOnHand, 2);
    // Quantity 2 <= threshold 4 -> isLowStock should now be true!
    assert.equal(res.body.product.isLowStock, true);
  });

  it('15. Should reject duplicate SKU within the same organization with 409', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Another Keyboard',
        sku: 'KB-ERGO-01', // duplicate
        quantityOnHand: 10,
      });

    assert.equal(res.status, 409);
    assert.match(res.body.error, /already exists/i);
  });

  it('17. Should reject negative quantities, negative prices, and negative thresholds', async () => {
    const badQty = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Bad Item',
        sku: 'BAD-QTY',
        quantityOnHand: -5,
      });
    assert.equal(badQty.status, 400);

    const badPrice = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Bad Item',
        sku: 'BAD-PRICE',
        quantityOnHand: 5,
        sellingPrice: -10,
      });
    assert.equal(badPrice.status, 400);

    const badThreshold = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send({
        name: 'Bad Item',
        sku: 'BAD-TH',
        quantityOnHand: 5,
        lowStockThreshold: -2,
      });
    assert.equal(badThreshold.status, 400);
  });

  it('14. Should delete a product by ID', async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Cookie', authCookie);

    assert.equal(res.status, 200);

    // Verify it is no longer returned
    const getRes = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Cookie', authCookie);

    assert.equal(getRes.status, 404);
  });
});

