import { getPino, type LoggerOptions, type MainLogger } from './getPino';
import type { LogLevelSetting } from './logLevel';
import { logLevel } from './logLevel';

export * from './getPino';
export * from './logLevel';

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

logLevel.once('changed', (level: LogLevelSetting) => {
	defaultLevel = getLevel(level);
});

export class Logger {
	readonly logger: MainLogger;

	constructor(loggerLabel: string, options: LoggerOptions = {}) {
		this.logger = getPino(loggerLabel, { level: defaultLevel, ...options });

		logLevel.on('changed', (level: LogLevelSetting) => {
			this.logger.level = getLevel(level);
		});
	}

	section(name: string, options: LoggerOptions = {}): MainLogger {
		const child = this.logger.child({ section: name }, { ...options });

		logLevel.on('changed', (level: LogLevelSetting) => {
			child.level = getLevel(level);
		});

		return child;
	}

	level(newLevel: string): void {
		this.logger.level = newLevel;
	}

	log(msg: object | string): void {
		this.logger.info(msg);
	}

	debug(msg: object | string): void {
		this.logger.debug(msg);
	}

	info(msg: object | string): void {
		this.logger.info(msg);
	}

	startup(msg: object | string): void {
		this.logger.startup(msg);
	}

	success(msg: object | string): void {
		this.logger.info(msg);
	}

	warn(msg: object | string): void {
		this.logger.warn(msg);
	}

	error(msg: object | string): void {
		this.logger.error(msg);
	}

	method(msg: object | string): void {
		this.logger.method(msg);
	}

	subscription(msg: object | string): void {
		this.logger.subscription(msg);
	}

	fatal(err: unknown, ...args: any[]): void {
		this.logger.fatal(err, ...args);
	}
}
