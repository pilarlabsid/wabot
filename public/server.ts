import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes/index';
import { botService } from './services/botService';

const app = express();
const port = process.env.PORT || 5002;

// CORS middleware - allow requests from dashboard
app.use(cors({
    origin: ['http://localhost:5001', 'http://127.0.0.1:5001'],
    credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount all modular routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
    logger.info(`🚀 Server is running on port ${port}`);
    logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🤖 Bot service initialized`);
    logger.info(`✅ Modular architecture active - All 52 endpoints available`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    botService.bot.clearSessionAndRestart();
    process.exit(0);
});
