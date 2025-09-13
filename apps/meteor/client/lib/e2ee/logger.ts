type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'font-weight: bold;',
	warn: 'color: black; background-color: yellow; font-weight: bold;',
	error: 'color: white; background-color: red; font-weight: bold;',
};

class Logger {
	static instances: Map<string, WeakRef<Logger>> = new Map();

	title: string;

	constructor(title: string) {
		if (Logger.instances.has(title)) {
			throw new Error(`Logger with title "${title}" already exists.`);
		}
		this.title = title;
	}

	span(label: string) {
		return new Span(this, label);
	}
}

class Span {
	logger: WeakRef<Logger>;

	label: string;

	constructor(logger: Logger, label: string) {
		this.logger = new WeakRef(logger);
		this.label = label;
	}

	private log(level: LogLevel, message: string, ...params: unknown[]) {
		console.groupCollapsed(`%c[${this.logger.deref()?.title}:${this.label}]`, styles[level]);
		console.trace(message);
		if (params.length) {
			console.log(...params);
		}
		console.groupEnd();
	}

	info(message: string, ...params: unknown[]) {
		this.log('info', message, ...params);
	}

	warn(message: string, ...params: unknown[]) {
		this.log('warn', message, ...params);
	}

	error(message: string, ...params: unknown[]) {
		this.log('error', message, ...params);
	}
}

export const createLogger = (title: string) => {
	return new Logger(title);
};
