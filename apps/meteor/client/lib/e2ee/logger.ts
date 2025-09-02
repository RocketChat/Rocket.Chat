class Logger {
	level: 0 | 1 | 2 | 3 | 4 | 5;

	prefix: string;

	constructor(prefix: string, level: 0 | 1 | 2 | 3 | 4 | 5) {
		this.level = level;
		this.prefix = prefix;
	}

	table<T>(tabularData: T, properties?: readonly Extract<keyof T, string>[]) {
		if (this.level <= 0) {
			console.table(tabularData, properties);
		}
	}

	log(...data: unknown[]) {
		if (this.level <= 0) {
			console.log(this.prefix, ...data);
		}
	}

	info(...data: unknown[]) {
		if (this.level <= 1) {
			console.info(this.prefix, ...data);
		}
	}

	warn(...data: unknown[]) {
		if (this.level <= 2) {
			console.warn(this.prefix, ...data);
		}
	}

	error(...data: unknown[]) {
		if (this.level <= 3) {
			console.error(this.prefix, ...data);
		}
	}

	debug(...data: unknown[]) {
		if (this.level <= 4) {
			console.debug(this.prefix, ...data);
		}
	}
}

export const logger = new Logger('E2EE', 0);
