import type { P } from 'pino';

import { settings } from '../../../app/settings/server';
import { getPino } from './getPino';

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
		case '0': return 'warn';
		case '1': return 'info';
		case '2': return 'debug';
		default: return 'warn';
	}
};

export class Logger {
	readonly logger: P.Logger;

	constructor(loggerLabel: string) {
		this.logger = getPino(loggerLabel);

		// TODO evaluate replacing this by an event emitter (since this callback is probably costly than an event emitter)
		settings.get('Log_Level', (_key, value) => {
			if (value != null) {
				this.logger.level = getLevel(String(value));
			}
		});

		// this.logger.info('a', { c: 'b' }, 'd');
	}

	section(name: string): P.Logger {
		return this.logger.child({ section: name });
	}

	level(newLevel: string): void {
		this.logger.level = newLevel;
	}

	log<T extends object>(obj: T, ...args: any[]): void;

	log(msg: string, ...args: any[]): void;

	log(msg: string, ...args: any[]): void {
		this.logger.info(msg, ...args);
	}

	debug<T extends object>(obj: T, ...args: any[]): void;

	debug(msg: string, ...args: any[]): void;

	debug(msg: string, ...args: any[]): void {
		this.logger.debug(msg, ...args);
	}

	info<T extends object>(obj: T, ...args: any[]): void;

	info(msg: string, ...args: any[]): void;

	info(msg: string, ...args: any[]): void {
		this.logger.info(msg, ...args);
	}

	success<T extends object>(obj: T, ...args: any[]): void;

	success(msg: string, ...args: any[]): void;

	success(msg: string, ...args: any[]): void {
		this.logger.info(msg, ...args);
	}

	warn<T extends object>(obj: T, ...args: any[]): void;

	warn(msg: string, ...args: any[]): void;

	warn(msg: string, ...args: any[]): void {
		this.logger.warn(msg, ...args);
	}

	error<T extends object>(obj: T, ...args: any[]): void;

	error(msg: string, ...args: any[]): void;

	error(msg: string, ...args: any[]): void {
		this.logger.error(msg, ...args);
	}

	method<T extends object>(obj: T, ...args: any[]): void;

	method(msg: string, ...args: any[]): void;

	method(msg: string, ...args: any[]): void {
		this.logger.method(msg, ...args);
	}

	subscription<T extends object>(obj: T, ...args: any[]): void;

	subscription(msg: string, ...args: any[]): void;

	subscription(msg: string, ...args: any[]): void {
		this.logger.subscription(msg, ...args);
	}
}
