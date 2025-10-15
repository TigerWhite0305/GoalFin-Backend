// backend/src/controllers/accounts.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createAccount,
  getAccountsByUserId,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountsSummary,
  transferBetweenAccounts,
  adjustAccountBalance
} from '../services/accounts.service';

/**
 * POST /api/accounts
 * Crea nuovo conto
 */
export const createAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId; // Dal middleware auth
    const { name, type, balance, currency, color, icon } = req.body;

    // Validazione
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nome e tipo sono obbligatori'
      });
    }

    const account = await createAccount({
      userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || 'EUR',
      color,
      icon
    });

    res.status(201).json({
      success: true,
      message: 'Conto creato con successo',
      data: account
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/accounts
 * Ottieni tutti i conti dell'utente
 */
export const getAccountsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const accounts = await getAccountsByUserId(userId);

    res.status(200).json({
      success: true,
      data: accounts
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/accounts/summary
 * Ottieni riepilogo conti
 */
export const getAccountsSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const summary = await getAccountsSummary(userId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/accounts/:id
 * Ottieni singolo conto
 */
export const getAccountByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const account = await getAccountById(id, userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Conto non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * PUT /api/accounts/:id
 * Modifica conto
 */
export const updateAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, type, balance, currency, color, icon, isActive } = req.body;

    const account = await updateAccount(id, userId, {
      name,
      type,
      balance,
      currency,
      color,
      icon,
      isActive
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Conto non trovato'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conto aggiornato con successo',
      data: account
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * DELETE /api/accounts/:id
 * Elimina conto
 */
export const deleteAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const deleted = await deleteAccount(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conto non trovato'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conto eliminato con successo'
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * POST /api/accounts/transfer
 * Trasferisce denaro tra due conti
 */
export const transferBetweenAccountsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // Validazione
    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'fromAccountId, toAccountId e amount sono obbligatori'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'L\'importo deve essere maggiore di zero'
      });
    }

    const result = await transferBetweenAccounts(
      userId,
      fromAccountId,
      toAccountId,
      amount,
      description
    );

    res.status(200).json({
      success: true,
      message: 'Trasferimento completato con successo',
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Fondi insufficienti') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Uno o entrambi i conti non sono stati trovati') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /api/accounts/:id/balance
 * Aggiusta il saldo di un conto
 */
export const adjustAccountBalanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { newBalance, reason } = req.body;

    // Validazione
    if (newBalance === undefined || newBalance === null) {
      return res.status(400).json({
        success: false,
        message: 'newBalance è obbligatorio'
      });
    }

    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Il saldo non può essere negativo'
      });
    }

    const result = await adjustAccountBalance(
      userId,
      id,
      newBalance,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Saldo aggiornato con successo',
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Conto non trovato') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};