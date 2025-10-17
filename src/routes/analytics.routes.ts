// backend/src/routes/analytics.routes.ts
import { Router } from 'express';
import {
  getTrendsController,
  getVariationsController,
  getCurrenciesController,
  createSnapshotsController,
  getAnalyticsOverviewController
} from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Tutte le route richiedono autenticazione
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/trends
 * @desc    Ottieni trend saldi ultimi 3 mesi
 * @access  Private
 */
router.get('/trends', getTrendsController);

/**
 * @route   GET /api/analytics/variations
 * @desc    Ottieni variazioni percentuali mensili
 * @access  Private
 */
router.get('/variations', getVariationsController);

/**
 * @route   GET /api/analytics/currencies
 * @desc    Ottieni breakdown per valuta
 * @access  Private
 */
router.get('/currencies', getCurrenciesController);

/**
 * @route   POST /api/analytics/snapshots
 * @desc    Crea snapshot giornalieri (per cron job)
 * @access  Private
 */
router.post('/snapshots', createSnapshotsController);

/**
 * @route   GET /api/analytics/overview
 * @desc    Ottieni tutti i dati analytics in una chiamata
 * @access  Private
 */
router.get('/overview', getAnalyticsOverviewController);

export default router;