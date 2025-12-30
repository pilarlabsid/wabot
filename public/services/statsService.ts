import { BotStats } from '../types/index';

class StatsService {
    formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    getStats(): BotStats {
        return {
            uptime: process.uptime(),
            uptimeFormatted: this.formatUptime(process.uptime()),
            memoryUsage: {
                rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
            },
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid
        };
    }
}

export const statsService = new StatsService();
