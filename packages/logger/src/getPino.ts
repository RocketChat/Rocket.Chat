import { pino, type ChildLoggerOptions } from 'pino';

const infoLevel = process.env.LESS_INFO_LOGS ? 20 : 35;

const mainPino = pino({
	customLevels: {
		http: infoLevel,
		method: infoLevel,
		subscription: infoLevel,
		startup: 51,
	},
	level: 'warn',
	timestamp: pino.stdTimeFunctions.isoTime,
	...(process.env.NODE_ENV !== 'production'
		? {
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
					},
				},
			}
		: {}),
});

export type MainLogger = typeof mainPino;

export type LoggerOptions = Pick<ChildLoggerOptions<keyof MainLogger['customLevels']>, 'level' | 'redact'>;

const defaultOptions: LoggerOptions = {
	level: 'warn',
};

export function getPino(name: string, options: LoggerOptions = {}): MainLogger {
	return mainPino.child({ name }, { ...defaultOptions, ...options });
}
