import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

const API_KEY = process.env.API_KEY || 'daa8ce0ff449a97c15a9159156cfb20a48bda1037450457f1c26e19159d7818a';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
        logger.warn(`Unauthorized access attempt from ${req.ip}`);
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }

    next();
};
