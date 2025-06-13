import pino from 'pino';

export interface Logger {
	info(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
}

const pinoLogger = pino({
	level: process.env.LOG_LEVEL || 'info',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			ignore: 'pid,hostname',
			translateTime: 'HH:MM:ss',
		},
	},
});

export function createLogger(name: string): Logger {
	const logger = pinoLogger.child({ module: name });
	
	return {
		info: (message: string, ...args: any[]) => logger.info({ ...args }, message),
		error: (message: string, ...args: any[]) => logger.error({ ...args }, message),
		warn: (message: string, ...args: any[]) => logger.warn({ ...args }, message),
		debug: (message: string, ...args: any[]) => logger.debug({ ...args }, message),
	};
}

export default createLogger('Homeserver');