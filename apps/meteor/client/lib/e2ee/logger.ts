const noop = (): void => {
	// do nothing
};

class Level<const T extends number = number> {

	static TRACE = new Level(0);

	static DEBUG = new Level(1);

	static INFO = new Level(2);

	static WARN = new Level(3);

	static ERROR = new Level(4);

	static fromString(label: string): Level | undefined {
		switch (label.toUpperCase()) {
			case 'TRACE':
				return Level.TRACE;
			case 'DEBUG':
				return Level.DEBUG;
			case 'INFO':
				return Level.INFO;
			case 'WARN':
				return Level.WARN;
			case 'ERROR':
				return Level.ERROR;
			default:
				return undefined;
		}
	}

	readonly value: T;

	private constructor(value: `${T}` extends `${string}.${string}` ? never : T) {
		this.value = value;
	}

	get [Symbol.toStringTag](): string {
		return `Level(${this.value})`;
	}

	toString(): string {
		switch (this.value) {
			case Level.TRACE.value:
				return 'TRACE';
			case Level.DEBUG.value:
				return 'DEBUG';
			case Level.INFO.value:
				return 'INFO';
			case Level.WARN.value:
				return 'WARN';
			case Level.ERROR.value:
				return 'ERROR';
			default:
				return `LEVEL(${this.value})`;
		}
	}

	compareTo(other: Level): number {
		return this.value - other.value;
	}
}

class LevelFilter {
	static OFF = new LevelFilter(undefined);

	static ERROR = LevelFilter.fromLevel(Level.ERROR);

	static WARN = LevelFilter.fromLevel(Level.WARN);

	static INFO = LevelFilter.fromLevel(Level.INFO);

	static DEBUG = LevelFilter.fromLevel(Level.DEBUG);

	static TRACE = LevelFilter.fromLevel(Level.TRACE);

	static fromLevel(level: Level): LevelFilter {
		return new LevelFilter(level);
	}

	readonly level: Level | undefined;

	private constructor(level: Level | undefined) {
		this.level = level ?? Level.INFO;
	}

	shouldLog(level: Level): boolean {
		if (!this.level) {
			return false;
		}
		return level.compareTo(this.level) >= 0;
	}
}

const getLevelFilter = (): Level => {
	const searchParams = new URLSearchParams(window.location.search);
	const logLevel = searchParams.get('logLevel') ?? 'INFO';
	const level = Level.fromString(logLevel) ?? Level.INFO;
	return level;
}


export const createLogger = (level: Level = getLevelFilter()) => {
	const filter = LevelFilter.fromLevel(level);
	return {
		log: filter.shouldLog(Level.INFO) ? console.log : noop,
		info: filter.shouldLog(Level.INFO) ? console.info : noop,
		warn: filter.shouldLog(Level.WARN) ? console.warn : noop,
		error: filter.shouldLog(Level.ERROR) ? console.error : noop,
		debug: filter.shouldLog(Level.DEBUG) ? console.debug : noop,
		trace: filter.shouldLog(Level.TRACE) ? console.trace : noop,
	};
}