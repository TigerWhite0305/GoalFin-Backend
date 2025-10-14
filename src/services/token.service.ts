// src/services/token.service.ts
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Genera un JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  return sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any
  });
};

/**
 * Verifica e decodifica un JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Token non valido o scaduto');
  }
};