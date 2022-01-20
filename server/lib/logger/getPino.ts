import { pino } from 'pino';
import type { P } from 'pino';

// make sure log queue is set up, so pino uses the overwritten process.stdout.write
import './logQueue';

// add support to multiple params on the log commands, i.e.:
// logger.info('user', Meteor.user()); // will print: {"level":30,"time":1629814080968,"msg":"user {\"username\": \"foo\"}"}
function logMethod(this: P.Logger, args: unknown[], method: any): void {
	if (args.length > 1) {
		args[0] = `${args[0]}${' %j'.repeat(args.length - 1)}`;
	}
	return method.apply(this, args);
}

const mainPino = pino({
	hooks: { logMethod },
	customLevels: {
		http: 35,
		method: 35,
		subscription: 35,
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

export function getPino(name: string, level = 'warn'): P.Logger {
	return mainPino.child({ name, level });
}
