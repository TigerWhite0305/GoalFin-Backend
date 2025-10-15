// backend/src/routes/accounts.routes.ts
import { Router } from 'express';
import {
  createAccountController,
  getAccountsController,
  getAccountByIdController,
  updateAccountController,
  deleteAccountController,
  getAccountsSummaryController,
  transferBetweenAccountsController,
  adjustAccountBalanceController
} from '../controllers/accounts.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Tutte le route richiedono autenticazione
router.use(authMiddleware);

/**
 * @route   POST /api/accounts
 * @desc    Crea nuovo conto
 * @access  Private
 */
router.post('/', createAccountController);

/**
 * @route   GET /api/accounts
 * @desc    Ottieni tutti i conti dell'utente
 * @access  Private
 */
router.get('/', getAccountsController);

/**
 * @route   GET /api/accounts/summary
 * @desc    Ottieni riepilogo conti (totale, per tipo, ecc.)
 * @access  Private
 */
router.get('/summary', getAccountsSummaryController);

/**
 * @route   POST /api/accounts/transfer
 * @desc    Trasferisci denaro tra due conti
 * @access  Private
 */
router.post('/transfer', transferBetweenAccountsController);

/**
 * @route   GET /api/accounts/:id
 * @desc    Ottieni singolo conto
 * @access  Private
 */
router.get('/:id', getAccountByIdController);

/**
 * @route   PUT /api/accounts/:id
 * @desc    Modifica conto
 * @access  Private
 */
router.put('/:id', updateAccountController);

/**
 * @route   PUT /api/accounts/:id/balance
 * @desc    Aggiusta saldo conto
 * @access  Private
 */
router.put('/:id/balance', adjustAccountBalanceController);

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Elimina conto
 * @access  Private
 */
router.delete('/:id', deleteAccountController);

export default router;