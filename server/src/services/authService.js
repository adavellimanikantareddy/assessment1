import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

export const registerUserAndOrg = async ({ organizationName, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedOrgName = organizationName.trim();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Transaction to create organization and owner user together
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: trimmedOrgName,
        defaultLowStockThreshold: 5,
      },
    });

    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    return user;
  });

  return {
    id: result.id,
    email: result.email,
    organizationId: result.organizationId,
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      defaultLowStockThreshold: result.organization.defaultLowStockThreshold,
    },
  };
};

export const authenticateUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      organization: true,
    },
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
    },
  };
};

