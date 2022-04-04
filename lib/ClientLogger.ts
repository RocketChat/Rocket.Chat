/**
 * This class implements logger.
 * @remarks
 */
export enum LogLevel {
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'verbose',
}
export class ClientLogger {
	module: string | undefined;

	logLevel: LogLevel | undefined;

	constructor(module: string, _level: LogLevel = LogLevel.info) {
		this.logLevel = _level;
		this.module = module;
	}

	private writeLog(level: LogLevel, log: any): void {
		const logLine = `${new Date().toISOString()} ${LogLevel[level]}  ${this.module}::${log}`;
		if (this.logLevel && this.logLevel < level) {
			return;
		}
		switch (level) {
			case LogLevel.warn:
				console.warn(logLine);
				break;
			case LogLevel.error:
			case LogLevel.fatal:
				console.error(logLine);
				break;
			default: {
				console.log(logLine);
			}
		}
	}

	verbose(...args: any[]): void {
		this.writeLog(LogLevel.verbose, args);
	}

	debug(...args: any[]): void {
		this.writeLog(LogLevel.debug, args);
	}

	info(...args: any[]): void {
		this.writeLog(LogLevel.info, args);
	}

	warn(...args: any[]): void {
		this.writeLog(LogLevel.warn, args);
	}

	error(...args: any[]): void {
		this.writeLog(LogLevel.error, args);
	}

	fatal(...args: any[]): void {
		this.writeLog(LogLevel.fatal, args);
	}

	setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}
}
