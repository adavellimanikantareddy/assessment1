import prisma from '../lib/prisma.js';
import { computeProductStockStatus } from './productService.js';

export const getDashboardStats = async (organizationId) => {
  // Fetch organization to get the current defaultLowStockThreshold
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  const defaultThreshold = organization?.defaultLowStockThreshold ?? 5;

  // Fetch all products for the tenant
  const products = await prisma.product.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' },
  });

  const totalProducts = products.length;

  let totalUnits = 0;
  const lowStockProducts = [];

  for (const product of products) {
    totalUnits += product.quantityOnHand;

    const computed = computeProductStockStatus(product, defaultThreshold);
    if (computed.isLowStock) {
      lowStockProducts.push(computed);
    }
  }

  return {
    totalProducts,
    totalUnits,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    defaultLowStockThreshold: defaultThreshold,
  };
};

