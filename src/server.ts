// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

// Carica variabili ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS - IMPORTANTE: Deve essere uno dei primi middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parser - DEVE essere dopo CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting - Limiti diversi per development e production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: NODE_ENV === 'development' ? 1000 : 100, // 1000 in dev, 100 in prod
  message: 'Troppe richieste da questo IP, riprova tra 15 minuti',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

console.log(`🛡️  Rate Limit: ${NODE_ENV === 'development' ? '1000' : '100'} richieste / 15 min`);

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trovata'
  });
});

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   🚀 GoalFin Backend Server          ║
  ║                                       ║
  ║   📍 Port: ${PORT}                      ║
  ║   🌍 Environment: ${NODE_ENV}        ║
  ║   🔗 URL: http://localhost:${PORT}      ║
  ║   ✅ CORS: http://localhost:3000      ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM ricevuto. Chiusura server...');
  process.exit(0);
});

export default app;