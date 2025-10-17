// backend/src/jobs/snapshotJob.ts
import cron from 'node-cron';
import prisma from '../config/database';
import { createDailySnapshots } from '../services/analytics.service';

/**
 * Job che crea snapshot giornalieri per tutti gli utenti
 * Esegue ogni giorno alle 23:59
 */
export const startSnapshotJob = () => {
  // Cron job giornaliero alle 23:59
  cron.schedule('59 23 * * *', async () => {
    console.log('🔄 Starting daily snapshot job...');
    
    try {
      // Ottieni tutti gli utenti attivi
      const users = await prisma.user.findMany({
        select: { id: true, email: true }
      });

      let totalSnapshots = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const snapshots = await createDailySnapshots(user.id);
          totalSnapshots += snapshots.length;
          successCount++;
          
          if (snapshots.length > 0) {
            console.log(`✅ Created ${snapshots.length} snapshots for user ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ Error creating snapshots for user ${user.email}:`, error);
          errorCount++;
        }
      }

      console.log(`📊 Snapshot job completed:`);
      console.log(`   - Users processed: ${users.length}`);
      console.log(`   - Success: ${successCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log(`   - Total snapshots created: ${totalSnapshots}`);
      
    } catch (error) {
      console.error('❌ Snapshot job failed:', error);
    }
  });

  console.log('📅 Daily snapshot job scheduled (23:59 every day)');
};

/**
 * Crea snapshot per un singolo utente (trigger manuale o su cambio saldo)
 */
export const triggerUserSnapshot = async (userId: string) => {
  try {
    const snapshots = await createDailySnapshots(userId);
    console.log(`📊 Manual snapshot created for user ${userId}: ${snapshots.length} snapshots`);
    return snapshots;
  } catch (error) {
    console.error(`❌ Manual snapshot failed for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Popola storico demo per testing
 */
export const populateDemoData = async (userId: string, days: number = 90) => {
  console.log(`🎲 Populating ${days} days of demo data for user ${userId}...`);
  
  try {
    // Ottieni conti dell'utente
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    if (accounts.length === 0) {
      console.log('⚠️ No accounts found for user');
      return [];
    }

    const snapshots = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(23, 59, 0, 0); // Fine giornata

      for (const account of accounts) {
        // Verifica se esiste già
        const existing = await prisma.accountSnapshot.findFirst({
          where: {
            accountId: account.id,
            date: {
              gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
          }
        });

        if (!existing) {
          // Genera variazione realistica basata sul saldo attuale
          const baseBalance = account.balance;
          const daysFromNow = i;
          
          // Trend generale: crescita lenta nel tempo
          const trendFactor = 1 - (daysFromNow * 0.001); // -0.1% per giorno indietro
          
          // Variazione giornaliera casuale ±2%
          const randomVariation = (Math.random() - 0.5) * 0.04;
          
          // Variazioni più grandi nei weekend (simulazione spese/entrate)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const weekendFactor = isWeekend ? (Math.random() - 0.5) * 0.1 : 0;
          
          const calculatedBalance = Math.max(0, baseBalance * (trendFactor + randomVariation + weekendFactor));

          const snapshot = await prisma.accountSnapshot.create({
            data: {
              accountId: account.id,
              userId: userId,
              balance: parseFloat(calculatedBalance.toFixed(2)),
              date: date,
              dayOfWeek: date.getDay(),
              dayOfMonth: date.getDate(),
              monthOfYear: date.getMonth() + 1,
              year: date.getFullYear()
            }
          });

          snapshots.push(snapshot);
        }
      }
    }

    console.log(`✅ Demo data populated: ${snapshots.length} snapshots created`);
    return snapshots;
    
  } catch (error) {
    console.error('❌ Demo data population failed:', error);
    throw error;
  }
};