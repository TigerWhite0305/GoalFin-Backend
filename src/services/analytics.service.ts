// backend/src/services/analytics.service.ts
import prisma from '../config/database';

/**
 * Crea snapshot giornaliero per tutti i conti attivi di un utente
 */
export const createDailySnapshots = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isActive: true
    }
  });

  const today = new Date();
  const snapshots = [];

  for (const account of accounts) {
    // Verifica se esiste già snapshot per oggi
    const existingSnapshot = await prisma.accountSnapshot.findFirst({
      where: {
        accountId: account.id,
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      }
    });

    if (!existingSnapshot) {
      const snapshot = await prisma.accountSnapshot.create({
        data: {
          accountId: account.id,
          userId: userId,
          balance: account.balance,
          date: today,
          dayOfWeek: today.getDay(),
          dayOfMonth: today.getDate(),
          monthOfYear: today.getMonth() + 1,
          year: today.getFullYear()
        }
      });
      snapshots.push(snapshot);
    }
  }

  return snapshots;
};

/**
 * Ottieni trend saldi ultimi 3 mesi
 */
export const getTrendsData = async (userId: string) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Ottieni tutti gli account dell'utente
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isActive: true
    }
  });

  if (accounts.length === 0) {
    return {
      hasData: false,
      trends: [],
      accounts: []
    };
  }

  // Ottieni snapshots degli ultimi 3 mesi
  const snapshots = await prisma.accountSnapshot.findMany({
    where: {
      userId,
      date: {
        gte: threeMonthsAgo
      }
    },
    orderBy: {
      date: 'asc'
    },
    include: {
      account: true
    }
  });

  if (snapshots.length === 0) {
    // Genera dati demo se non ci sono snapshots
    return generateDemoTrends(accounts);
  }

  // Raggruppa per data e calcola totale giornaliero
  const trendsByDate = snapshots.reduce((acc, snapshot) => {
    const dateKey = snapshot.date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        total: 0,
        accounts: {}
      };
    }
    
    acc[dateKey].total += snapshot.balance;
    acc[dateKey].accounts[snapshot.account.name] = snapshot.balance;
    
    return acc;
  }, {} as Record<string, any>);

  const trends = Object.values(trendsByDate) as Array<{
    date: string;
    total: number;
    accounts: Record<string, number>;
  }>;

  return {
    hasData: true,
    trends,
    accounts: accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      color: acc.color,
      type: acc.type
    }))
  };
};

/**
 * Calcola variazioni percentuali mensili
 */
export const getVariationsData = async (userId: string) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Saldo corrente
  const currentAccounts = await prisma.account.findMany({
    where: {
      userId,
      isActive: true
    }
  });

  const currentTotal = currentAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Saldo fine mese scorso (da snapshot o calcolo)
  const lastMonthSnapshots = await prisma.accountSnapshot.findMany({
    where: {
      userId,
      date: {
        gte: lastMonthStart,
        lte: lastMonthEnd
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: currentAccounts.length
  });

  let lastMonthTotal = 0;
  
  if (lastMonthSnapshots.length > 0) {
    // Usa l'ultimo snapshot disponibile per ogni account
    const accountBalances = new Map();
    lastMonthSnapshots.forEach(snapshot => {
      if (!accountBalances.has(snapshot.accountId)) {
        accountBalances.set(snapshot.accountId, snapshot.balance);
      }
    });
    lastMonthTotal = Array.from(accountBalances.values()).reduce((sum, balance) => sum + balance, 0);
  } else {
    // Se non ci sono snapshot, genera una variazione demo
    lastMonthTotal = currentTotal * (0.95 + Math.random() * 0.1); // Variazione tra -5% e +5%
  }

  // Calcola variazioni
  const totalVariation = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  
  // Variazioni per tipo di conto
  const variationsByType = await calculateVariationsByType(userId, currentAccounts, currentMonthStart, lastMonthStart, lastMonthEnd);

  return {
    hasData: lastMonthSnapshots.length > 0,
    currentTotal,
    lastMonthTotal,
    totalVariation,
    variationsByType,
    period: {
      current: currentMonthStart.toISOString(),
      previous: lastMonthStart.toISOString()
    }
  };
};

/**
 * Ottieni breakdown per valuta
 */
export const getCurrenciesData = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isActive: true
    }
  });

  // Raggruppa per valuta
  const currencyBreakdown = accounts.reduce((acc, account) => {
    const currency = account.currency;
    
    if (!acc[currency]) {
      acc[currency] = {
        currency,
        totalBalance: 0,
        accountCount: 0,
        accounts: []
      };
    }
    
    acc[currency].totalBalance += account.balance;
    acc[currency].accountCount++;
    acc[currency].accounts.push({
      id: account.id,
      name: account.name,
      balance: account.balance,
      type: account.type
    });
    
    return acc;
  }, {} as Record<string, any>);

  const currencies = Object.values(currencyBreakdown) as Array<{
    currency: string;
    totalBalance: number;
    accountCount: number;
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      type: string;
    }>;
  }>;
  const totalValue = currencies.reduce((sum, curr: any) => sum + curr.totalBalance, 0);

  // Calcola percentuali
  currencies.forEach((curr: any) => {
    curr.percentage = totalValue > 0 ? (curr.totalBalance / totalValue) * 100 : 0;
  });

  return {
    currencies,
    totalValue,
    currencyCount: currencies.length
  };
};

/**
 * Genera dati demo per trend quando non ci sono snapshots
 */
const generateDemoTrends = (accounts: any[]) => {
  const trends = [];
  const today = new Date();
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    let dailyTotal = 0;
    const accountsData: Record<string, number> = {};
    
    accounts.forEach(account => {
      // Genera una variazione casuale basata sul saldo attuale
      const baseBalance = account.balance;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variazione
      const dailyBalance = baseBalance * (1 + variation);
      
      accountsData[account.name] = dailyBalance;
      dailyTotal += dailyBalance;
    });
    
    trends.push({
      date: date.toISOString().split('T')[0],
      total: dailyTotal,
      accounts: accountsData
    });
  }
  
  return {
    hasData: false,
    trends,
    accounts: accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      color: acc.color,
      type: acc.type
    })),
    isDemo: true
  };
};

/**
 * Calcola variazioni per tipo di conto
 */
const calculateVariationsByType = async (
  userId: string,
  currentAccounts: any[],
  currentMonthStart: Date,
  lastMonthStart: Date,
  lastMonthEnd: Date
) => {
  const typeVariations: Record<string, any> = {};
  
  // Raggruppa conti correnti per tipo
  const accountsByType = currentAccounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Calcola per ogni tipo
  for (const [type, accounts] of Object.entries(accountsByType) as [string, any[]][]) {
    const accountsArr = accounts as any[];
    const currentTotal = accountsArr.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Prova a trovare snapshots del mese scorso per questo tipo
    const accountIds = accountsArr.map(acc => acc.id);
    const lastMonthSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        userId,
        accountId: { in: accountIds },
        date: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    let lastMonthTotal = 0;
    if (lastMonthSnapshots.length > 0) {
      const latestByAccount = new Map();
      lastMonthSnapshots.forEach(snapshot => {
        if (!latestByAccount.has(snapshot.accountId)) {
          latestByAccount.set(snapshot.accountId, snapshot.balance);
        }
      });
      lastMonthTotal = Array.from(latestByAccount.values()).reduce((sum, balance) => sum + balance, 0);
    } else {
      // Demo variation
      lastMonthTotal = currentTotal * (0.95 + Math.random() * 0.1);
    }
    
    const variation = lastMonthTotal > 0 ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    
    typeVariations[type] = {
      type,
      currentTotal,
      lastMonthTotal,
      variation,
      accountCount: accountsArr.length
    };
  }
  
  return typeVariations;
};