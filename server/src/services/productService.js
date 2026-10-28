import prisma from '../lib/prisma.js';

export const computeProductStockStatus = (product, defaultThreshold = 5) => {
  const effectiveThreshold =
    product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
      ? product.lowStockThreshold
      : defaultThreshold;

  const isLowStock = product.quantityOnHand <= effectiveThreshold;

  return {
    ...product,
    effectiveThreshold,
    isLowStock,
  };
};

export const listProducts = async ({ organizationId, search, defaultThreshold = 5 }) => {
  const where = {
    organizationId,
  };

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { sku: { contains: term } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return products.map((p) => computeProductStockStatus(p, defaultThreshold));
};

export const getProductById = async ({ id, organizationId, defaultThreshold = 5 }) => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      organizationId, // STRICT TENANT ISOLATION
    },
  });

  if (!product) {
    return null;
  }

  return computeProductStockStatus(product, defaultThreshold);
};

export const createProduct = async ({
  organizationId,
  name,
  sku,
  description,
  quantityOnHand,
  costPrice,
  sellingPrice,
  lowStockThreshold,
  defaultThreshold = 5,
}) => {
  const normalizedSku = sku.trim();

  // Explicit check for existing SKU within organization
  const existing = await prisma.product.findFirst({
    where: {
      organizationId,
      sku: normalizedSku,
    },
  });

  if (existing) {
    const error = new Error(`A product with SKU "${normalizedSku}" already exists in your organization.`);
    error.statusCode = 409;
    throw error;
  }

  const product = await prisma.product.create({
    data: {
      organizationId,
      name: name.trim(),
      sku: normalizedSku,
      description: description ? description.trim() : null,
      quantityOnHand: Number(quantityOnHand) || 0,
      costPrice: costPrice !== undefined && costPrice !== null && costPrice !== '' ? Number(costPrice) : null,
      sellingPrice: sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '' ? Number(sellingPrice) : null,
      lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '' ? Number(lowStockThreshold) : null,
    },
  });

  return computeProductStockStatus(product, defaultThreshold);
};

export const updateProduct = async ({
  id,
  organizationId,
  name,
  sku,
  description,
  quantityOnHand,
  costPrice,
  sellingPrice,
  lowStockThreshold,
  defaultThreshold = 5,
}) => {
  // STRICT TENANT ISOLATION: verify product belongs to this organization
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingProduct) {
    const error = new Error('Product not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  const normalizedSku = sku ? sku.trim() : existingProduct.sku;

  // If SKU is being changed, check for conflict within organization
  if (normalizedSku !== existingProduct.sku) {
    const duplicate = await prisma.product.findFirst({
      where: {
        organizationId,
        sku: normalizedSku,
        NOT: { id },
      },
    });

    if (duplicate) {
      const error = new Error(`A product with SKU "${normalizedSku}" already exists in your organization.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (sku !== undefined) updateData.sku = normalizedSku;
  if (description !== undefined) updateData.description = description ? description.trim() : null;
  if (quantityOnHand !== undefined) updateData.quantityOnHand = Number(quantityOnHand);
  if (costPrice !== undefined) {
    updateData.costPrice = costPrice !== null && costPrice !== '' ? Number(costPrice) : null;
  }
  if (sellingPrice !== undefined) {
    updateData.sellingPrice = sellingPrice !== null && sellingPrice !== '' ? Number(sellingPrice) : null;
  }
  if (lowStockThreshold !== undefined) {
    updateData.lowStockThreshold = lowStockThreshold !== null && lowStockThreshold !== '' ? Number(lowStockThreshold) : null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return computeProductStockStatus(updatedProduct, defaultThreshold);
};

export const deleteProduct = async ({ id, organizationId }) => {
  // STRICT TENANT ISOLATION: verify product belongs to this organization
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existingProduct) {
    const error = new Error('Product not found in your organization.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.product.delete({
    where: { id },
  });

  return { message: 'Product deleted successfully.' };
};

