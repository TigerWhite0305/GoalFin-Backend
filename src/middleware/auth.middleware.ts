// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/token.service';

/**
 * Middleware per verificare JWT token
 * Protegge le route che richiedono autenticazione
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Estrai token dall'header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token di autenticazione mancante'
      });
    }

    const token = authHeader.substring(7); // Rimuovi "Bearer "

    // Verifica token
    const decoded = verifyToken(token);

    // Aggiungi userId alla request per usarlo nei controller
    (req as any).userId = decoded.userId;
    (req as any).userEmail = decoded.email;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
  }
};