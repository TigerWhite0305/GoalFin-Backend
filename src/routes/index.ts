// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Health check interno (oltre a /health globale)
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'GoalFin API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;