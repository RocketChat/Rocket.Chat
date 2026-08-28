/**
 * App logger. Mirrors legacy `ILogger` but is a plain leveled logger; log
 * persistence/rotation is a runtime concern the app never sees.
 */
export interface Logger {
	debug(...args: unknown[]): void;
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}
