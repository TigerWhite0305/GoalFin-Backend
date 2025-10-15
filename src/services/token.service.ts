// src/services/token.service.ts
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface TokenPayload {
  userId: string;
  email: string;
}

interface TokenOptions {
  rememberMe?: boolean;
}

/**
 * Genera un JWT token con durata variabile
 * @param payload - Dati utente (userId, email)
 * @param options - Opzioni token (rememberMe)
 * @returns JWT token string
 */
export const generateToken = (
  payload: TokenPayload, 
  options: TokenOptions = {}
): string => {
  // Se "Ricordami" è spuntato → 90 giorni (3 mesi)
  // Altrimenti → 24 ore
  const expiresIn = options.rememberMe ? '90d' : '24h';
  
  return sign(payload, JWT_SECRET, {
    expiresIn
  });
};

/**
 * Verifica e decodifica un JWT token
 * @param token - JWT token da verificare
 * @returns Payload decodificato
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Token non valido o scaduto');
  }
};