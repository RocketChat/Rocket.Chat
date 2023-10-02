// Copied from meteor/logging package
import chalk from 'chalk';
import { stringify } from 'ejson';

type Color = typeof chalk.Color;
type NonGrayColors = Exclude<Color, 'gray' | 'grey'>;

type Colors = Exclude<`${Color}Bright` | Color, 'grayBright' | 'greyBright'>;

type LogMessage = {
	time?: Date;
	timeInexact?: boolean;
	level?: 'debug' | 'info' | 'warn' | 'error';
	file?: string;
	line?: number;
	app?: string;
	originApp?: string;
	message?: string;
	program?: string;
	satellite?: string;
	stderr?: string;
	color?: Colors;
};

type Options = {
	color?: boolean;
	metaColor?: NonGrayColors;
};

const RESTRICTED_KEYS = ['time', 'timeInexact', 'level', 'file', 'line', 'program', 'originApp', 'satellite', 'stderr'];

const FORMATTED_KEYS = [...RESTRICTED_KEYS, 'app', 'message'];

const LEVEL_COLORS: Record<string, NonGrayColors> = {
	debug: 'green',
	// leave info as the default color
	warn: 'magenta',
	error: 'red',
	info: 'blue',
};

const META_COLOR = 'blue';

chalk.level = 2;

// Default colors cause readability problems on Windows Powershell,
// switch to bright variants. While still capable of millions of
// operations per second, the benchmark showed a 25%+ increase in
// ops per second (on Node 8) by caching "process.platform".
const isWin32 = typeof process === 'object' && process.platform === 'win32';
const platformColor = (color: NonGrayColors): `${NonGrayColors}Bright` | NonGrayColors => {
	if (isWin32 && typeof color === 'string' && !color.endsWith('Bright')) {
		return `${color}Bright`;
	}
	return color;
};

const prettify = function (line = '', color?: Colors) {
	if (!color) return line;
	// @ts-expect-error - greyBright doesnt exists, its just gray :(
	return chalk[color](line);
};

export const format = (obj: LogMessage, options: Options = {}) => {
	obj = { ...obj }; // don't mutate the argument
	const {
		time,
		timeInexact,
		level = 'info',
		file,
		line: lineNumber,
		app: appName = '',
		originApp,
		program = '',
		satellite = '',
		stderr = '',
	} = obj;

	let { message } = obj;

	if (!(time instanceof Date)) {
		throw new Error("'time' must be a Date object");
	}

	FORMATTED_KEYS.forEach((key) => {
		// @ts-expect-error - we know this is good
		delete obj[key];
	});

	if (Object.keys(obj).length > 0) {
		if (message) {
			message += ' ';
		}
		message += stringify(obj);
	}

	const pad2 = (n: number) => n.toString().padStart(2, '0');
	const pad3 = (n: number) => n.toString().padStart(3, '0');

	const dateStamp = time.getFullYear().toString() + pad2(time.getMonth() + 1 /* 0-based*/) + pad2(time.getDate());
	const timeStamp = `${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}.${pad3(time.getMilliseconds())}`;

	// eg in San Francisco in June this will be '(-7)'
	const utcOffsetStr = `(${-(new Date().getTimezoneOffset() / 60)})`;

	let appInfo = '';
	if (appName) {
		appInfo += appName;
	}
	if (originApp && originApp !== appName) {
		appInfo += ` via ${originApp}`;
	}
	if (appInfo) {
		appInfo = `[${appInfo}] `;
	}

	const sourceInfoParts = [];
	if (program) {
		sourceInfoParts.push(program);
	}
	if (file) {
		sourceInfoParts.push(file);
	}
	if (lineNumber) {
		sourceInfoParts.push(lineNumber);
	}

	let sourceInfo = !sourceInfoParts.length ? '' : `(${sourceInfoParts.join(':')}) `;

	if (satellite) sourceInfo += `[${satellite}]`;

	const stderrIndicator = stderr ? '(STDERR) ' : '';

	const metaPrefix = [
		level.charAt(0).toUpperCase(),
		dateStamp,
		'-',
		timeStamp,
		utcOffsetStr,
		timeInexact ? '? ' : ' ',
		appInfo,
		sourceInfo,
		stderrIndicator,
	].join('');

	return (
		prettify(metaPrefix, options.color ? platformColor(options.metaColor || META_COLOR) : undefined) +
		prettify(message, options.color ? platformColor(LEVEL_COLORS[level]) : undefined)
	);
};
