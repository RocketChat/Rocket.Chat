import { pino, P } from 'pino';

import { settings } from '../../../app/settings/server';

// const oldCustomLevels = {
// 	levels: {
// 		error: 0,
// 		deprecation: 1,
// 		warn: 2,
// 		success: 3,
// 		info: 4,
// 		debug: 5,

// 		// custom
// 	},
// 	colors: {
// 		error: 'red',
// 		deprecation: 'magenta',
// 		warn: 'magenta',
// 		success: 'green',
// 		info: 'blue',
// 		debug: 'blue',
// 	},
// };

const getLevel = (level: string): string => {
	switch (level) {
		case '0': return 'error';
		case '1': return 'info';
		case '2': return 'debug';
		default: return 'error';
	}
};

// add support to multiple params on the log commands, i.e.:
// logger.info('user', Meteor.user()); // will print: {"level":30,"time":1629814080968,"msg":"user {\"username\": \"foo\"}"}
function logMethod(args: unknown[], method: any): void {
	if (args.length > 1) {
		args[0] = `${ args[0] }${ ' %j'.repeat(args.length - 1) }`;
	}
	return method.apply(this, args);
}

export class Logger {
	private logger: P.Logger;

	constructor(loggerLabel: string, { sections }: { sections?: Record<string, string> } = {}) {
		this.logger = pino({ name: loggerLabel, hooks: { logMethod } });

		if (sections) {
			Object.keys(sections).forEach((section) => {
				this[section as any] = this.logger.child({ section: sections[section] });
			});
		}

		settings.get('Log_Level', (_key, value) => {
			if (value != null) {
				this.logger.level = getLevel(String(value));
			}
		});

		// this.logger.info('a', { c: 'b' }, 'd');
	}

	level(newLevel: string): void {
		this.logger.level = newLevel;
	}

	log(...args: any[]): void {
		this.logger.info(...args);
	}

	// eslint-disable-next-line @typescript-eslint/camelcase
	success_box(...args: any[]): void {
		this.logger.info(...args);
	}

	// eslint-disable-next-line @typescript-eslint/camelcase
	oauth_updated(...args: any[]): void {
		this.logger.info(...args);
	}

	debug(...args: any[]): void {
		this.logger.debug(...args);
	}

	info(...args: any[]): void {
		this.logger.info(...args);
	}

	success(...args: any[]): void {
		this.logger.info(...args);
	}

	warn(...args: any[]): void {
		this.logger.warn(...args);
	}

	// eslint-disable-next-line @typescript-eslint/camelcase
	stop_rendering(...args: any[]): void {
		this.logger.info(...args);
	}
}
