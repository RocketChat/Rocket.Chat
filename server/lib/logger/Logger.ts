import type { MainLogger } from './getPino';
import { getPino } from './getPino';
import { logLevel, LogLevelSetting } from './logLevel';

const getLevel = (level: LogLevelSetting): string => {
	switch (level) {
		case '0':
			return 'warn';
		case '1':
			return 'info';
		case '2':
			return 'debug';
		default:
			return 'warn';
	}
};

let defaultLevel = 'warn';

logLevel.once('changed', (level) => {
	defaultLevel = getLevel(level);
});

export class Logger {
	readonly logger: MainLogger;

	constructor(loggerLabel: string) {
		this.logger = getPino(loggerLabel, defaultLevel);

		logLevel.on('changed', (level) => {
			this.logger.level = getLevel(level);
		});
	}

	section(name: string): MainLogger {
		const child = this.logger.child({ section: name }) as MainLogger;

		logLevel.on('changed', (level) => {
			child.level = getLevel(level);
		});

		return child;
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

	startup<T extends object>(obj: T, ...args: any[]): void;

	startup(msg: string, ...args: any[]): void;

	startup(msg: string, ...args: any[]): void {
		this.logger.startup(msg, ...args);
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
