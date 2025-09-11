type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'color: green; background-color: white; font-weight: bold;',
	warn: 'color: orange; background-color: white; font-weight: bold;',
	error: 'color: red; background-color: white; font-weight: bold;',
};

export const createLogger = (label: string) => {
	return (level: LogLevel, ...[first, ...msg]: [string, ...unknown[]]) => {
		console.groupCollapsed(`%c[${level}][${label}]`, styles[level], first);
		console.trace(...msg);
		console.groupEnd();
	};
};
