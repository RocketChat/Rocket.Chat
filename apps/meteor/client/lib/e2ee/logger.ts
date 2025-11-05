import { getConfig } from '../utils/getConfig';

let debug: boolean | undefined = undefined;

const isDebugEnabled = (): boolean => {
	if (debug === undefined) {
		debug = getConfig('debug') === 'true' || getConfig('debug-e2e') === 'true';
	}

	return debug;
};

const noopSpan: ISpan = {
	set(_key: string, _value: unknown) {
		return this;
	},
	info(_message: string) {
		/**/
	},
	warn(_message: string) {
		/**/
	},
	error(_message: string, _error?: unknown) {
		/**/
	},
};

class Logger {
	title: string;

	constructor(title: string) {
		this.title = title;
	}

	span(label: string): ISpan {
		return isDebugEnabled() ? new Span(new WeakRef(this), label, console) : noopSpan;
	}
}

interface ISpan {
	set(key: string, value: unknown): this;
	info(message: string): void;
	warn(message: string): void;
	error(message: string, error?: unknown): void;
}

type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'font-weight: bold;',
	warn: 'color: black; background-color: yellow; font-weight: bold;',
	error: 'color: white; background-color: red; font-weight: bold;',
};

class Span {
	private logger: WeakRef<Logger>;

	private label: string;

	private attributes = new Map<string, unknown>();

	private console: Console;

	constructor(logger: WeakRef<Logger>, label: string, console: Console) {
		this.logger = logger;
		this.label = label;
		this.console = console;
	}

	private log(level: LogLevel, message: string) {
		this.console.groupCollapsed(`%c[${this.logger.deref()?.title}:${this.label}]%c ${message}`, styles[level], 'font-weight: normal;');
		this.console.dir(Object.fromEntries(this.attributes.entries()), {});
		this.console.trace();
		this.console.groupEnd();
	}

	set(key: string, value: unknown) {
		this.attributes.set(key, value);
		return this;
	}

	info(message: string) {
		this.log('info', message);
	}

	warn(message: string) {
		this.log('warn', message);
	}

	error(message: string, error?: unknown) {
		if (error) {
			this.set('error', error);
		}
		this.log('error', message);
	}
}

export const createLogger = (title: string) => {
	return new Logger(title);
};
