import prisma from '../lib/prisma.js';
import { verifyToken, AUTH_COOKIE_NAME } from '../lib/jwt.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    // Also support Authorization Bearer header for testing/flexibility
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      res.clearCookie(AUTH_COOKIE_NAME);
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      res.clearCookie(AUTH_COOKIE_NAME);
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // Attach verified user and organization context to request
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    };

    next();
  } catch (error) {
    next(error);
  }
};

