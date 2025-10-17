// scripts/seed/analyticsSeeder.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carica variabili ambiente
dotenv.config();

const prisma = new PrismaClient();

/**
 * Popola dati analytics demo per tutti gli utenti o un utente specifico
 */
async function seedAnalyticsData(specificUserId?: string, days: number = 90) {
  console.log('🌱 Starting Analytics Data Seeding...');
  console.log(`📅 Generating ${days} days of historical data`);
  
  try {
    // Ottieni utenti da processare
    const users = specificUserId 
      ? await prisma.user.findMany({ where: { id: specificUserId } })
      : await prisma.user.findMany();

    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    console.log(`👥 Processing ${users.length} user(s)`);

    let totalSnapshotsCreated = 0;
    let usersProcessed = 0;
    let usersSkipped = 0;

    for (const user of users) {
      console.log(`\n🔄 Processing user: ${user.email} (${user.id})`);
      
      // Ottieni conti dell'utente
      const accounts = await prisma.account.findMany({
        where: {
          userId: user.id,
          isActive: true
        }
      });

      if (accounts.length === 0) {
        console.log(`   ⚠️  No active accounts found for ${user.email}`);
        usersSkipped++;
        continue;
      }

      console.log(`   📊 Found ${accounts.length} accounts`);

      // Controlla se ha già snapshots
      const existingSnapshots = await prisma.accountSnapshot.count({
        where: { userId: user.id }
      });

      if (existingSnapshots > 0) {
        console.log(`   ⚠️  User already has ${existingSnapshots} snapshots, skipping...`);
        usersSkipped++;
        continue;
      }

      // Genera snapshots storici
      const userSnapshots = await generateHistoricalSnapshots(
        user.id, 
        accounts, 
        days
      );

      totalSnapshotsCreated += userSnapshots.length;
      usersProcessed++;
      
      console.log(`   ✅ Created ${userSnapshots.length} snapshots for ${user.email}`);
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   👥 Users processed: ${usersProcessed}`);
    console.log(`   ⏭️  Users skipped: ${usersSkipped}`);
    console.log(`   📈 Total snapshots created: ${totalSnapshotsCreated}`);
    console.log('✅ Analytics seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

/**
 * Genera snapshots storici per un utente specifico
 */
async function generateHistoricalSnapshots(
  userId: string, 
  accounts: any[], 
  days: number
) {
  const snapshots = [];
  const today = new Date();

  console.log(`   🎲 Generating ${days} days of realistic data...`);

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(23, 59, 0, 0); // Fine giornata

    for (const account of accounts) {
      // Verifica se esiste già snapshot per questa data
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
        const calculatedBalance = calculateRealisticBalance(
          account.balance, 
          i, 
          date, 
          account.type
        );

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

  return snapshots;
}

/**
 * Calcola saldo realistico basato su trend e variazioni
 */
function calculateRealisticBalance(
  currentBalance: number, 
  daysFromNow: number, 
  date: Date, 
  accountType: string
): number {
  // Trend generale basato sul tipo di conto
  let trendFactor = 1;
  
  switch (accountType) {
    case 'savings':
      // Crescita costante nei risparmi
      trendFactor = 1 - (daysFromNow * 0.0005); // -0.05% per giorno
      break;
    case 'checking':
      // Più variabile, leggera crescita
      trendFactor = 1 - (daysFromNow * 0.0008); // -0.08% per giorno
      break;
    case 'investment':
      // Più volatilità ma crescita maggiore
      trendFactor = 1 - (daysFromNow * 0.001); // -0.1% per giorno
      break;
    case 'cash':
      // Tendenza a diminuire (spese quotidiane)
      trendFactor = 1 - (daysFromNow * 0.002); // -0.2% per giorno
      break;
    default:
      trendFactor = 1 - (daysFromNow * 0.001);
  }
  
  // Variazione giornaliera casuale ±3%
  const randomVariation = (Math.random() - 0.5) * 0.06;
  
  // Variazioni maggiori nei weekend (spese/entrate)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const weekendFactor = isWeekend ? (Math.random() - 0.5) * 0.15 : 0;
  
  // Variazioni mensili (stipendi, bollette)
  const isPayday = date.getDate() >= 25 && date.getDate() <= 28;
  const paydayFactor = isPayday && accountType === 'checking' ? 0.1 : 0;
  
  const finalBalance = Math.max(
    0, 
    currentBalance * (trendFactor + randomVariation + weekendFactor + paydayFactor)
  );

  return finalBalance;
}

/**
 * Pulisce tutti gli snapshots (per testing)
 */
async function clearAnalyticsData(userId?: string) {
  console.log('🧹 Clearing analytics data...');
  
  const whereClause = userId ? { userId } : {};
  
  const deleted = await prisma.accountSnapshot.deleteMany({
    where: whereClause
  });
  
  console.log(`🗑️  Deleted ${deleted.count} snapshots`);
}

/**
 * Main function per gestire CLI arguments
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const userId = args[1];
  const days = parseInt(args[2]) || 90;

  try {
    switch (command) {
      case 'seed':
        await seedAnalyticsData(userId, days);
        break;
      case 'clear':
        await clearAnalyticsData(userId);
        break;
      case 'reseed':
        await clearAnalyticsData(userId);
        await seedAnalyticsData(userId, days);
        break;
      default:
        console.log(`
📊 Analytics Seeder Commands:

npm run seed:analytics seed [userId] [days]     - Seed analytics data
npm run seed:analytics clear [userId]           - Clear analytics data  
npm run seed:analytics reseed [userId] [days]   - Clear and reseed

Examples:
npm run seed:analytics seed                      - Seed all users, 90 days
npm run seed:analytics seed user-123 30         - Seed specific user, 30 days
npm run seed:analytics clear                     - Clear all analytics data
npm run seed:analytics reseed                    - Clear and reseed all users
        `);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();