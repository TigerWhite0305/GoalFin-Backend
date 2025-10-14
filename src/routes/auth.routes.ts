// src/routes/auth.routes.ts
import { Router } from 'express';
import {
  registerController,
  loginController,
  getMeController,
  logoutController
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registra nuovo utente
 * @access  Public
 */
router.post('/register', registerController);

/**
 * @route   POST /api/auth/login
 * @desc    Login utente
 * @access  Public
 */
router.post('/login', loginController);

/**
 * @route   GET /api/auth/me
 * @desc    Ottieni profilo utente corrente
 * @access  Private (richiede token)
 */
router.get('/me', authMiddleware, getMeController);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente
 * @access  Private
 */
router.post('/logout', authMiddleware, logoutController);

export default router;