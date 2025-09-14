/* eslint-disable @typescript-eslint/naming-convention */
type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'font-weight: bold;',
	warn: 'color: black; background-color: yellow; font-weight: bold;',
	error: 'color: white; background-color: red; font-weight: bold;',
};


interface ConsoleWithContext extends Console {
	context(label: string): Console;
}

const console = ((): ConsoleWithContext => {
	if ('context' in globalThis.console) {
		return globalThis.console as ConsoleWithContext;
	}

	return {
		...globalThis.console,
		
		context(_label: string) {
			return globalThis.console
		}
	};
})();

class Logger {
	title: string;

	constructor(title: string) {
		this.title = title;
	}

	span(label: string) {
		return new Span(new WeakRef(this), label, console.context(this.title));
	}

	instrument(label: string, fn: () => void) {
		const span = this.span(label);
		try {
			span.info('start');
			fn();
			span.info('end');
		} catch (error) {
			span.error('error', error);
			throw error;
		}
	}
}

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
		this.console.dir(Object.fromEntries(this.attributes.entries()), { });
		this.console.groupEnd();
		this.console.trace();
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
