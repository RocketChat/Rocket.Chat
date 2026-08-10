/** Minimal pino-compatible logger surface used across the package. */
export type Logger = {
	debug: (obj: unknown, msg?: string) => void;
	info: (obj: unknown, msg?: string) => void;
	warn: (obj: unknown, msg?: string) => void;
	error: (obj: unknown, msg?: string) => void;
	child: (bindings: Record<string, unknown>) => Logger;
};
