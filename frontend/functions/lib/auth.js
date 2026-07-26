// JWT sign/verify (replacing jsonwebtoken) and the admin-auth Hono
// middleware (replacing backend/middleware/adminAuth.js), using `jose`
// which runs on Web Crypto and is Workers-compatible.
import { SignJWT, jwtVerify } from 'jose';

const TOKEN_TTL = '7d';

function secretKey(env) {
  return new TextEncoder().encode(env.JWT_SECRET);
}

async function signToken(env, adminId) {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey(env));
}

async function verifyToken(env, token) {
  const { payload } = await jwtVerify(token, secretKey(env));
  return payload.adminId;
}

// Hono middleware: 401s unless `Authorization: Bearer <token>` is a valid
// admin JWT, otherwise sets c.set('adminId', ...) and continues.
async function requireAdmin(c, next) {
  const header = c.req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const adminId = await verifyToken(c.env, token);
    c.set('adminId', adminId);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}

export { signToken, verifyToken, requireAdmin };
