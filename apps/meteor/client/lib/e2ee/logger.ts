type LogLevel = 'info' | 'warn' | 'error';

const styles: Record<LogLevel, string> = {
	info: 'color: green; background-color: white; font-weight: bold;',
	warn: 'color: orange; background-color: white; font-weight: bold;',
	error: 'color: red; background-color: white; font-weight: bold;',
};

const icon: Record<LogLevel, string> = {
	info:  'ⓘ',
	warn: '⚠️',
	error: '❌',
};

export const createLogger = (label: string) => {
	return (level: LogLevel, title: string, message: unknown, ...params: unknown[]) => {
		console.groupCollapsed(`${icon[level]} %c[${label}:${title}]`, styles[level]);
		console.log(message, ...params);
		console.trace();
		console.groupEnd();
	};
};
