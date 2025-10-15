// backend/src/controllers/accounts.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createAccount,
  getAccountsByUserId,
  getAccountById,
  updateAccount,
  deleteAccount,
  getAccountsSummary
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