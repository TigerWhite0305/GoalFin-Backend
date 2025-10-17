// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import analyticsRoutes from './analytics.routes'; // ← NUOVO

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Accounts routes (Portfolio)
router.use('/accounts', accountsRoutes);

// Analytics routes (Dashboard Analytics)
router.use('/analytics', analyticsRoutes); // ← NUOVO

// Health check interno
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'GoalFin API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;