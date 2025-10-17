// backend/src/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  getTrendsData,
  getVariationsData,
  getCurrenciesData,
  createDailySnapshots
} from '../services/analytics.service';

/**
 * GET /api/analytics/trends
 * Ottieni trend saldi ultimi 3 mesi
 */
export const getTrendsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const trendsData = await getTrendsData(userId);

    res.status(200).json({
      success: true,
      data: trendsData
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/analytics/variations
 * Ottieni variazioni percentuali mensili
 */
export const getVariationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const variationsData = await getVariationsData(userId);

    res.status(200).json({
      success: true,
      data: variationsData
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/analytics/currencies
 * Ottieni breakdown per valuta
 */
export const getCurrenciesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const currenciesData = await getCurrenciesData(userId);

    res.status(200).json({
      success: true,
      data: currenciesData
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * POST /api/analytics/snapshots
 * Crea snapshot giornalieri (per cron job o trigger manuale)
 */
export const createSnapshotsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const snapshots = await createDailySnapshots(userId);

    res.status(201).json({
      success: true,
      message: `${snapshots.length} snapshots creati`,
      data: snapshots
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * GET /api/analytics/overview
 * Ottieni tutti i dati analytics in una chiamata
 */
export const getAnalyticsOverviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    // Esegui tutte le query in parallelo per performance
    const [trendsData, variationsData, currenciesData] = await Promise.all([
      getTrendsData(userId),
      getVariationsData(userId),
      getCurrenciesData(userId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        trends: trendsData,
        variations: variationsData,
        currencies: currenciesData,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    next(error);
  }
};