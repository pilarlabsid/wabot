import winston from 'winston';
import moment from 'moment-timezone';

// Fungsi untuk mendapatkan timestamp dengan zona waktu Jakarta (GMT+7)
const timezoned = () => moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

// Konfigurasi logger dengan Winston
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: timezoned }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? `\n${stack}` : ''}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
                })
            )
        })
    ]
});
