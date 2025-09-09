const noop = (): void => {
	// do nothing
};


export const createLogger = (level: 0 | 1 | 2 | 3 | 4 | 5 = 0) => {
	return {
		log: level <= 0 ? console.log.bind(console) : noop,
		info: level <= 1 ? console.info.bind(console) : noop,
		warn: level <= 2 ? console.warn.bind(console) : noop,
		error: level <= 3 ? console.error.bind(console) : noop,
		debug: level <= 4 ? console.debug.bind(console) : noop,
		trace: level <= 5 ? console.trace.bind(console) : noop,
	};
}