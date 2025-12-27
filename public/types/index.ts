export interface WebhookConfig {
    url: string;
    secret?: string;
    events: string[];
    enabled: boolean;
}

export interface ConnectionState {
    isConnected: boolean;
    qrCode: string | null;
    pairingCode: string | null;
    phoneNumber: string | null;
    lastQRUpdate: string | null;
    lastPairingUpdate: string | null;
}

export interface BotInfo {
    jid: string | null;
    name: string;
    phone: string | null;
    isConnected: boolean;
    platform: string;
    version: string;
}

export interface BotStats {
    uptime: number;
    uptimeFormatted: string;
    memoryUsage: {
        rss: string;
        heapUsed: string;
        heapTotal: string;
    };
    platform: string;
    nodeVersion: string;
    pid: number;
}
