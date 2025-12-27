import express from 'express';
import bodyParser from 'body-parser';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { botService } from './services/botService.js';

const app = express();
const port = process.env.PORT || 3000;

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
    await botService.bot.logout();
    process.exit(0);
});
