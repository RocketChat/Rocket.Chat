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

	private log(level: LogLevel, message: string) {
		console.groupCollapsed(`%c[${this.logger.deref()?.title}:${this.label}]%c ${message}`, styles[level], 'color: gray; font-weight: normal;');
		
		this.attributes.forEach((values, key) => {
			console.log(`%c${key}:`, 'font-weight: bold;', ...values);
		});

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
