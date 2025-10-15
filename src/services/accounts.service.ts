// backend/src/services/accounts.service.ts
import prisma from '../config/database';

interface CreateAccountData {
  userId: string;
  name: string;
  type: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
}

interface UpdateAccountData {
  name?: string;
  type?: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

/**
 * Crea nuovo conto
 */
export const createAccount = async (data: CreateAccountData) => {
  const account = await prisma.account.create({
    data: {
      userId: data.userId,
      name: data.name,
      type: data.type,
      balance: data.balance || 0,
      currency: data.currency || 'EUR',
      color: data.color,
      icon: data.icon,
      isActive: true
    }
  });

  return account;
};

/**
 * Ottieni tutti i conti dell'utente
 */
export const getAccountsByUserId = async (userId: string) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isActive: true // Solo conti attivi
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return accounts;
};

/**
 * Ottieni singolo conto (verifica che appartenga all'utente)
 */
export const getAccountById = async (accountId: string, userId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId // Verifica proprietà
    }
  });

  return account;
};

/**
 * Aggiorna conto
 */
export const updateAccount = async (
  accountId: string,
  userId: string,
  data: UpdateAccountData
) => {
  // Verifica che il conto appartenga all'utente
  const account = await getAccountById(accountId, userId);
  
  if (!account) {
    return null;
  }

  // Aggiorna solo i campi forniti
  const updated = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.type && { type: data.type }),
      ...(data.balance !== undefined && { balance: data.balance }),
      ...(data.currency && { currency: data.currency }),
      ...(data.color && { color: data.color }),
      ...(data.icon && { icon: data.icon }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    }
  });

  return updated;
};

/**
 * Elimina conto (soft delete: isActive = false)
 */
export const deleteAccount = async (accountId: string, userId: string) => {
  // Verifica che il conto appartenga all'utente
  const account = await getAccountById(accountId, userId);
  
  if (!account) {
    return false;
  }

  // Soft delete: imposta isActive a false
  await prisma.account.update({
    where: { id: accountId },
    data: { isActive: false }
  });

  return true;
};

/**
 * Ottieni riepilogo conti (totale, per tipo, ecc.)
 */
export const getAccountsSummary = async (userId: string) => {
  const accounts = await getAccountsByUserId(userId);

  // Calcola totale
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Raggruppa per tipo
  const byType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = {
        count: 0,
        balance: 0
      };
    }
    acc[account.type].count++;
    acc[account.type].balance += account.balance;
    return acc;
  }, {} as Record<string, { count: number; balance: number }>);

  return {
    totalBalance,
    totalAccounts: accounts.length,
    byType,
    accounts
  };
};

/**
 * Trasferisce denaro tra due conti
 */
export const transferBetweenAccounts = async (
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string
) => {
  // Verifica che entrambi i conti appartengano all'utente
  const fromAccount = await getAccountById(fromAccountId, userId);
  const toAccount = await getAccountById(toAccountId, userId);

  if (!fromAccount || !toAccount) {
    throw new Error('Uno o entrambi i conti non sono stati trovati');
  }

  // Verifica fondi sufficienti
  if (fromAccount.balance < amount) {
    throw new Error('Fondi insufficienti');
  }

  // Verifica che non sia lo stesso conto
  if (fromAccountId === toAccountId) {
    throw new Error('Non puoi trasferire denaro allo stesso conto');
  }

  // Esegui il trasferimento in una transazione
  const [updatedFrom, updatedTo] = await prisma.$transaction([
    prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: fromAccount.balance - amount }
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: { balance: toAccount.balance + amount }
    })
  ]);

  return {
    from: updatedFrom,
    to: updatedTo,
    amount,
    description
  };
};

/**
 * Aggiusta il saldo di un conto
 */
export const adjustAccountBalance = async (
  userId: string,
  accountId: string,
  newBalance: number,
  reason?: string
) => {
  // Verifica che il conto appartenga all'utente
  const account = await getAccountById(accountId, userId);

  if (!account) {
    throw new Error('Conto non trovato');
  }

  // Aggiorna il saldo
  const updated = await prisma.account.update({
    where: { id: accountId },
    data: { balance: newBalance }
  });

  return {
    account: updated,
    oldBalance: account.balance,
    newBalance,
    difference: newBalance - account.balance,
    reason
  };
};