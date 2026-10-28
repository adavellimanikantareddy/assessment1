import { registerUserAndOrg, authenticateUser } from '../services/authService.js';
import { signToken, getAuthCookieOptions, AUTH_COOKIE_NAME } from '../lib/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = async (req, res, next) => {
  try {
    const { organizationName, email, password, confirmPassword } = req.body;

    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = await registerUserAndOrg({ organizationName, email, password });
    const token = signToken({ userId: user.id, organizationId: user.organizationId });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(201).json({
      message: 'Account created successfully.',
      user,
      token, // also return token for clients or API tests
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await authenticateUser({ email, password });
    const token = signToken({ userId: user.id, organizationId: user.organizationId });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.json({
      message: 'Logged in successfully.',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    path: '/',
  });
  res.json({ message: 'Logged out successfully.' });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};

