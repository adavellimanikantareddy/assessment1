import prisma from '../lib/prisma.js';

export const getOrganizationSettings = async (organizationId) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!organization) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  return organization;
};

export const updateOrganizationSettings = async ({ organizationId, defaultLowStockThreshold }) => {
  const threshold = Number(defaultLowStockThreshold);

  if (isNaN(threshold) || !Number.isInteger(threshold) || threshold < 0) {
    const error = new Error('Default low-stock threshold must be a non-negative integer.');
    error.statusCode = 400;
    throw error;
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      defaultLowStockThreshold: threshold,
    },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      updatedAt: true,
    },
  });

  return updatedOrg;
};

