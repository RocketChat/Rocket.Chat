import { pino } from 'pino';

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

export function getPino(name: string, level = 'warn'): MainLogger {
	return mainPino.child({ name }, { level }) as MainLogger;
}
