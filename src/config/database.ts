// src/config/database.ts
import { PrismaClient } from '@prisma/client';

// Estendi PrismaClient per logging in development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Connessione al database
prisma.$connect()
  .then(() => {
    console.log('✅ Database PostgreSQL connesso con successo');
  })
  .catch((error) => {
    console.error('❌ Errore connessione database:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('👋 Database disconnesso');
});

export default prisma;