class Logger {
	level: 0 | 1 | 2 | 3 | 4;

	constructor(level: 0 | 1 | 2 | 3 | 4) {
		this.level = level;
	}

	log(...data: unknown[]) {
		if (this.level <= 0) {
			console.log(...data);
		}
	}

	info(...data: unknown[]) {
		if (this.level <= 1) {
			console.info(...data);
		}
	}

	warn(...data: unknown[]) {
		if (this.level <= 2) {
			console.warn(...data);
		}
	}

	error(...data: unknown[]) {
		if (this.level <= 3) {
			console.error(...data);
		}
	}

	debug(...data: unknown[]) {
		if (this.level <= 4) {
			console.debug(...data);
		}
	}
}

export const logger = new Logger(4);
