import { WebhookConfig } from '../types/index';
import { logger } from '../config/logger';
import crypto from 'crypto';

class WebhookService {
    private config: WebhookConfig | null = null;

    configure(url: string, secret?: string, events: string[] = ['*']) {
        this.config = {
            url,
            secret,
            events,
            enabled: true
        };
        logger.info(`Webhook configured: ${url}`);
    }

    async send(event: string, data: any) {
        if (!this.config || !this.config.enabled) return;
        if (!this.config.events.includes(event) && !this.config.events.includes('*')) return;

        try {
            const payload = {
                event,
                timestamp: new Date().toISOString(),
                data
            };

            const headers: any = {
                'Content-Type': 'application/json',
                'X-Webhook-Event': event
            };

            if (this.config.secret) {
                const signature = crypto
                    .createHmac('sha256', this.config.secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                headers['X-Webhook-Signature'] = signature;
            }

            const response = await fetch(this.config.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                logger.warn(`Webhook delivery failed: ${response.status} ${response.statusText}`);
            } else {
                logger.info(`Webhook delivered: ${event}`);
            }
        } catch (error: any) {
            logger.error(`Webhook error: ${error.message}`);
        }
    }

    getConfig() {
        return this.config;
    }

    enable() {
        if (this.config) {
            this.config.enabled = true;
            logger.info('Webhook enabled');
        }
    }

    disable() {
        if (this.config) {
            this.config.enabled = false;
            logger.info('Webhook disabled');
        }
    }
}

export const webhookService = new WebhookService();
