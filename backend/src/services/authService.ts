import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change-me-in-production-use-a-long-random-string') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET must be set in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    }
    console.warn('[Auth] WARNING: Using default JWT_SECRET. Set a secure secret in .env for production.');
    return 'dev-only-default-secret-not-for-production';
  }
  return secret;
}

const JWT_EXPIRES_IN = '24h';
const REFRESH_EXPIRES_IN = '30d';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: Pick<JwtPayload, 'id'>): string {
  return jwt.sign({ id: payload.id, type: 'refresh' }, getJwtSecret(), { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
