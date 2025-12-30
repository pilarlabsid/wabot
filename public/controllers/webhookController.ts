import { Request, Response } from 'express';
import { webhookService } from '../services/webhookService';
import { logger } from '../config/logger';

export class WebhookController {
    async configure(req: Request, res: Response) {
        const { url, secret, events } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'url is required' });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        webhookService.configure(url, secret, events || ['*']);

        const config = webhookService.getConfig();
        res.status(200).json({
            success: true,
            message: 'Webhook configured successfully',
            data: {
                url: config?.url,
                events: config?.events,
                hasSecret: !!config?.secret
            }
        });
    }

    async getStatus(req: Request, res: Response) {
        const config = webhookService.getConfig();

        if (!config) {
            return res.status(200).json({
                success: true,
                data: {
                    configured: false,
                    enabled: false
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                configured: true,
                enabled: config.enabled,
                url: config.url,
                events: config.events,
                hasSecret: !!config.secret
            }
        });
    }

    async disable(req: Request, res: Response) {
        webhookService.disable();
        res.status(200).json({
            success: true,
            message: 'Webhook disabled successfully'
        });
    }

    async enable(req: Request, res: Response) {
        const config = webhookService.getConfig();

        if (!config) {
            return res.status(400).json({
                error: 'No webhook configured. Use POST /webhooks/configure first.'
            });
        }

        webhookService.enable();
        res.status(200).json({
            success: true,
            message: 'Webhook enabled successfully'
        });
    }

    async test(req: Request, res: Response) {
        const config = webhookService.getConfig();

        if (!config) {
            return res.status(400).json({
                error: 'No webhook configured'
            });
        }

        try {
            await webhookService.send('webhook.test', {
                message: 'This is a test webhook',
                timestamp: new Date().toISOString()
            });

            res.status(200).json({
                success: true,
                message: 'Test webhook sent successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export const webhookController = new WebhookController();
