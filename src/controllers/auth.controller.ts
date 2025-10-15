// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { register, login, getUserProfile } from '../services/auth.service';

/**
 * POST /api/auth/register
 * Registra nuovo utente
 */
export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Validazione base
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e password sono obbligatori'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 6 caratteri'
      });
    }

    const result = await register({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Email già registrata') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login utente con supporto "Ricordami"
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, rememberMe } = req.body; // ← AGGIUNTO rememberMe

    // Validazione base
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono obbligatori'
      });
    }

    // Passa rememberMe al service
    const result = await login({ 
      email, 
      password, 
      rememberMe: rememberMe || false // ← Default false se non specificato
    });

    // Log per debug (rimuovere in production)
    console.log(`✅ Login effettuato - Durata token: ${rememberMe ? '90 giorni' : '24 ore'}`);

    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Email o password errati') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Ottieni profilo utente corrente (richiede autenticazione)
 */
export const getMeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // userId è stato aggiunto dal middleware auth
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non autorizzato'
      });
    }

    const user = await getUserProfile(userId);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    if (error.message === 'Utente non trovato') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout utente (lato client rimuove il token)
 */
export const logoutController = async (
  req: Request,
  res: Response
) => {
  // Con JWT stateless, il logout è gestito lato client
  // Qui possiamo solo confermare l'operazione
  res.status(200).json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};