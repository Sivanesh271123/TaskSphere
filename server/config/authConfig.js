import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing required environment variable JWT_SECRET');
}

export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
export const COOKIE_MAX_AGE = {
  standard: 7 * 24 * 60 * 60,
  rememberMe: 30 * 24 * 60 * 60
};
export const COOKIE_SECURE = process.env.NODE_ENV === 'production';
