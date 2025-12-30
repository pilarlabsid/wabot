import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
};
