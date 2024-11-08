// Inspired from the opentelemetry logs spec

export enum LOG_LEVEL {
	TRACE = 1,
	DEBUG = 5,
	INFO = 9,
	WARN = 13,
	ERROR = 17,
	FATAL = 21,
}

export interface ILogger {
	trace(body: string | Record<string, any>): void;

	debug(body: string | Record<string, any>): void;

	info(body: string | Record<string, any>): void;

	error(body: string | Record<string, any>): void;

	fatal(body: string | Record<string, any>): void;

	warn(body: string | Record<string, any>): void;

	createNewInstanceFor(name: string): ILogger;
}
