import type { Logger } from 'pino';
import { pino } from 'pino';

import { injectable } from '../../../../dependency-injection';
import { ENV } from '../../../definition';
import type { ILogger } from '../../definition';
import { LOG_LEVEL } from '../../definition';
import { overwriteStdout } from './queue';

let mainPino: Logger | undefined;

export type LoggerConfig = { name: string; overrideStdout: boolean; lessInfoLogs: boolean; env: ENV; defaultLevel: LOG_LEVEL };

@injectable()
export class ConsoleLogger implements ILogger {
	private logger: Logger;

	private config: LoggerConfig;

	constructor(config: LoggerConfig) {
		this.config = config;
		this.createMainPinoInstanceIfNeeded(config);
		if (!mainPino) {
			throw new Error('Pino logger instance could not be created');
		}
		this.logger = mainPino.child({ name: config.name });
		if (config.overrideStdout) {
			overwriteStdout();
		}
	}

	public trace(body: string | Record<string, any>): void {
		this.logger.trace(body);
	}

	public debug(body: string | Record<string, any>): void {
		this.logger.debug(body);
	}

	public info(body: string | Record<string, any>): void {
		this.logger.info(body);
	}

	public error(body: string | Record<string, any>): void {
		this.logger.error(body);
	}

	public fatal(body: string | Record<string, any>): void {
		this.logger.fatal(body);
	}

	public warn(body: string | Record<string, any>): void {
		this.logger.warn(body);
	}

	public createNewInstanceFor(name: string): ILogger {
		return new ConsoleLogger({ ...this.config, name: `${this.config.name}-${name}` });
	}

	private getLevelName(level: LOG_LEVEL): string {
		const levelNames = {
			[LOG_LEVEL.INFO]: 'info',
			[LOG_LEVEL.WARN]: 'warn',
			[LOG_LEVEL.TRACE]: 'trace',
			[LOG_LEVEL.DEBUG]: 'debug',
			[LOG_LEVEL.ERROR]: 'error',
			[LOG_LEVEL.FATAL]: 'fatal',
		};

		return levelNames[level] || 'info';
	}

	private createMainPinoInstanceIfNeeded(config: LoggerConfig): void {
		if (mainPino) {
			return;
		}
		mainPino = pino({
			customLevels: {
				trace: LOG_LEVEL.TRACE,
				info: LOG_LEVEL.INFO,
				debug: LOG_LEVEL.DEBUG,
				error: LOG_LEVEL.ERROR,
				fatal: LOG_LEVEL.FATAL,
				warn: LOG_LEVEL.WARN,
			},
			level: this.getLevelName(config.defaultLevel),
			timestamp: pino.stdTimeFunctions.isoTime,
			...(config.env !== ENV.PRODUCTION
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
	}
}
