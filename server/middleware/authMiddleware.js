import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/authConfig.js';

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(valueParts.join('='));
    return acc;
  }, {});
}

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const cookies = parseCookies(req.headers.cookie || '');
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const token = tokenFromHeader || cookies.token || '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
