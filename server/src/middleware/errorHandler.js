export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Prisma unique constraint violation (e.g. unique email or unique [organizationId, sku])
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    if (Array.isArray(target) && target.includes('sku')) {
      return res.status(409).json({ error: 'A product with this SKU already exists in your organization.' });
    }
    if (Array.isArray(target) && target.includes('email')) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    return res.status(409).json({ error: 'A duplicate record already exists.' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Requested resource was not found.' });
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

