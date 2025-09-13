type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'font-weight: bold;',
	warn: 'color: black; background-color: yellow; font-weight: bold;',
	error: 'color: white; background-color: red; font-weight: bold;',
};

class Logger {
	title: string;

	constructor(title: string) {
		this.title = title;
	}

	span(label: string) {
		return new Span(new WeakRef(this), label);
	}
}

class Span {
	logger: WeakRef<Logger>;

	label: string;

	attributes = new Map<string, unknown[]>();

	constructor(logger: WeakRef<Logger>, label: string) {
		this.logger = logger;
		this.label = label;
	}

	private log(level: LogLevel, message: string, ...params: unknown[]) {
		console.groupCollapsed(`%c[${this.logger.deref()?.title}:${this.label}]%c ${message}`, styles[level], 'color: gray; font-weight: normal;', ...params);
		if (this.attributes.size > 0) {
			console.table(Object.fromEntries(this.attributes));
		}
		console.trace();
		console.groupEnd();
	}
	
	set(key: string, value: unknown) {
		if (this.attributes.has(key)) {
			this.attributes.get(key)?.push(value);
			return this;
		}
		this.attributes.set(key, [value]);
		return this;
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
