import { createLogger, format, transports } from 'winston';

import { settings } from '../../../app/settings/server';

const { combine, timestamp, label, printf, errors } = format;

const oldCustomLevels = {
	levels: {
		error: 0,
		deprecation: 1,
		warn: 2,
		success: 3,
		info: 4,
		debug: 5,

		// custom
	},
	colors: {
		error: 'red',
		deprecation: 'magenta',
		warn: 'magenta',
		success: 'green',
		info: 'blue',
		debug: 'blue',
	},
};

const logFormat = (info: Record<string, string>): string => `[${ info.timestamp }] - ${ info.level.toUpperCase() } - ${ info.label }${ info.section ? ` -> ${ info.section }` : '' } | ${ info.message }`;

const consoleTransporter = new transports.Console();

export class Logger {
	private logger: any;

	constructor(loggerLabel: string, { sections }: { sections?: Record<string, string> } = {}) {
		this.logger = createLogger({
			levels: oldCustomLevels.levels,
			format: combine(
				// colorize(),
				errors({ stack: true }),
				timestamp(),
				label({ label: loggerLabel }),
				printf(logFormat),
			),
			transports: [
				consoleTransporter,
			],
		});

		if (sections) {
			Object.keys(sections).forEach((section) => {
				this[section as any] = createLogger({
					levels: oldCustomLevels.levels,
					format: combine(
						// colorize(),
						errors({ stack: true }),
						timestamp(),
						label({ label: loggerLabel }),
						format((info: any) => {
							info.section = section;
							return info;
						})(),
						printf(logFormat),
					),
					transports: [
						consoleTransporter,
					],
				});
			});
		}
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
		this.logger.success(...args);
	}

	warn(...args: any[]): void {
		this.logger.warn(...args);
	}

	// eslint-disable-next-line @typescript-eslint/camelcase
	stop_rendering(...args: any[]): void {
		this.logger.info(...args);
	}

	publish(...args: any[]): void {
		this.logger.info(...args);
	}

	method(...args: any[]): void {
		this.logger.info(...args);
	}
}

const getLevel = (level: string): string => {
	switch (level) {
		case '0': return 'error';
		case '1': return 'info';
		case '2': return 'debug';
		default: return 'error';
	}
};

settings.get('Log_Level', (_key, value) => {
	if (value != null) {
		consoleTransporter.level = getLevel(String(value));
	}
});
