import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

const Formatter = {
	prettify(line: string, _color?: string | undefined) {
		return line;
	},
};

interface ILogMessage {
	level: 'debug' | 'info' | 'warn' | 'error';
	message?: string;
	time?: Date;
	timeInexact?: boolean;
	app?: string;
	originApp?: string;
	program?: string;
	file?: string;
	line?: string | number;
	satellite?: string;
	stderr?: string;
	omitCallerDetails?: boolean;
	[key: string]: any;
}

interface ILogOptions {
	color?: boolean;
	metaColor?: string;
}

interface ILogFunction {
	(...args: any[]): void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	_intercept: (count: number) => void;
	_suppress: (count: number) => void;
	_intercepted: () => string[];
	outputFormat: 'json' | 'colored-text';
	showTime: boolean;
	_getCallerDetails: () => { line?: string; file?: string };
	parse: (line: string) => any;
	format: (obj: ILogMessage, options?: ILogOptions) => string;
	objFromText: (line: string, override?: any) => any;
}

const Log = function (...args: any[]) {
	Log.info(...args);
} as ILogFunction;

// / FOR TESTING
let intercept = 0;
let interceptedLines: string[] = [];
let suppress = 0;

// Intercept the next 'count' calls to a Log function. The actual
// lines printed to the console can be cleared and read by calling
// Log._intercepted().
Log._intercept = (count: number) => {
	intercept += count;
};

// Suppress the next 'count' calls to a Log function. Use this to stop
// tests from spamming the console, especially with red errors that
// might look like a failing test.
Log._suppress = (count: number) => {
	suppress += count;
};

// Returns intercepted lines and resets the intercept counter.
Log._intercepted = () => {
	const lines = interceptedLines;
	interceptedLines = [];
	intercept = 0;
	return lines;
};

// Either 'json' or 'colored-text'.
//
// When this is set to 'json', print JSON documents that are parsed by another
// process ('satellite' or 'meteor run'). This other process should call
// 'Log.format' for nice output.
//
// When this is set to 'colored-text', call 'Log.format' before printing.
// This should be used for logging from within satellite, since there is no
// other process that will be reading its standard output.
Log.outputFormat = 'json';

// Defaults to true for local development and for backwards compatibility.
// for cloud environments is interesting to leave it false as most of them have the timestamp in the console.
// Only works in server with colored-text
Log.showTime = true;

const LEVEL_COLORS: Record<string, string> = {
	debug: 'green',
	// leave info as the default color
	warn: 'magenta',
	error: 'red',
};

const META_COLOR = 'blue';

// XXX package
const RESTRICTED_KEYS = ['time', 'timeInexact', 'level', 'file', 'line', 'program', 'originApp', 'satellite', 'stderr'];

const FORMATTED_KEYS = [...RESTRICTED_KEYS, 'app', 'message'];

const logInBrowser = (obj: any) => {
	const str = Log.format(obj);

	// XXX Some levels should be probably be sent to the server
	const { level } = obj;

	if (typeof console !== 'undefined' && (console as any)[level]) {
		(console as any)[level](str);
		return;
	}

	// IE doesn't have console.log.apply, it's not a real Object.
	// http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
	// http://patik.com/blog/complete-cross-browser-console-log/
	if (typeof console.log.apply === 'function') {
		// Most browsers
		console.log.apply(console, [str]);
	} else if (typeof Function.prototype.bind === 'function') {
		// IE9
		const log = Function.prototype.bind.call(console.log, console);
		log.apply(console, [str]);
	}
};

// @returns {Object: { line: Number, file: String }}
Log._getCallerDetails = () => {
	const getStack = () => {
		// We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
		// pre-parsed stack) since it's impossible to compose it with the use of
		// Error.prepareStackTrace used on the server for source maps.
		const err = new Error();
		const { stack } = err;
		return stack;
	};

	const stack = getStack();

	if (!stack) return {};

	// looking for the first line outside the logging package (or an
	// eval if we find that first)
	let line;
	const lines = stack.split('\n').slice(1);
	// eslint-disable-next-line
	for (line of lines) {
		if (line.match(/^\s*(at eval \(eval)|(eval:)/)) {
			return { file: 'eval' };
		}

		if (!line.match(/packages\/(?:local-test[:_])?logging(?:\/|\.js)/)) {
			break;
		}
	}

	const details: { line?: string; file?: string } = {};

	// The format for FF is 'functionName@filePath:lineNumber'
	// The format for V8 is 'functionName (packages/logging/logging.js:81)' or
	//                      'packages/logging/logging.js:81'
	const match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line as string);
	if (!match) {
		return details;
	}

	// in case the matched block here is line:column
	details.line = match[2].split(':')[0];

	// Possible format: https://foo.bar.com/scripts/file.js?random=foobar
	// XXX: if you can write the following in better way, please do it
	// XXX: what about evals?
	details.file = match[1].split('/').slice(-1)[0].split('?')[0];

	return details;
};

['debug', 'info', 'warn', 'error'].forEach((level) => {
	// @param arg {String|Object}
	(Log as any)[level] = (arg: any) => {
		if (suppress) {
			suppress--;
			return;
		}

		let intercepted = false;
		if (intercept) {
			intercept--;
			intercepted = true;
		}

		let obj = arg === Object(arg) && !(arg instanceof RegExp) && !(arg instanceof Date) ? arg : { message: String(arg) };

		RESTRICTED_KEYS.forEach((key) => {
			if (obj[key]) {
				throw new Error(`Can't set '${key}' in log message`);
			}
		});

		if (hasOwn(obj, 'message') && typeof obj.message !== 'string') {
			throw new Error("The 'message' field in log objects must be a string");
		}

		if (!obj.omitCallerDetails) {
			obj = { ...Log._getCallerDetails(), ...obj };
		}

		obj.time = new Date();
		obj.level = level;

		// If we are in production don't write out debug logs.
		if (level === 'debug' && Meteor.isProduction) {
			return;
		}

		if (intercepted) {
			interceptedLines.push(EJSON.stringify(obj));
		} else if (Meteor.isServer) {
			if (Log.outputFormat === 'colored-text') {
				console.log(Log.format(obj, { color: true }));
			} else if (Log.outputFormat === 'json') {
				console.log(EJSON.stringify(obj));
			} else {
				throw new Error(`Unknown logging output format: ${Log.outputFormat}`);
			}
		} else {
			logInBrowser(obj);
		}
	};
});

// tries to parse line as EJSON. returns object if parse is successful, or null if not
Log.parse = (line: string) => {
	let obj = null;
	if (line?.startsWith('{')) {
		// might be json generated from calling 'Log'
		try {
			obj = EJSON.parse(line);
		} catch (e) {
			// ignore
		}
	}

	// XXX should probably check fields other than 'time'
	if (obj?.time && obj.time instanceof Date) {
		return obj;
	}
	return null;
};

// formats a log object into colored human and machine-readable text
Log.format = (obj: any, options: ILogOptions = {}) => {
	obj = { ...obj }; // don't mutate the argument
	const {
		time,
		timeInexact,
		level = 'info',
		file,
		line: lineNumber,
		app: appName = '',
		originApp,
		message = '',
		program = '',
		satellite = '',
		stderr = '',
	} = obj;

	if (!(time instanceof Date)) {
		throw new Error("'time' must be a Date object");
	}

	FORMATTED_KEYS.forEach((key) => {
		delete obj[key];
	});

	let messageField = message;
	if (Object.keys(obj).length > 0) {
		if (messageField) {
			messageField += ' ';
		}
		messageField += EJSON.stringify(obj);
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

	const timeString = Log.showTime ? `${dateStamp}-${timeStamp}${utcOffsetStr}${timeInexact ? '? ' : ' '}` : ' ';

	const metaPrefix = [level.charAt(0).toUpperCase(), timeString, appInfo, sourceInfo, stderrIndicator].join('');

	return (
		Formatter.prettify(metaPrefix, options.color && options.metaColor ? options.metaColor : META_COLOR) +
		Formatter.prettify(messageField, options.color ? LEVEL_COLORS[level] : undefined)
	);
};

// Turn a line of text into a loggable object.
// @param line {String}
// @param override {Object}
Log.objFromText = (line: string, override: any) => {
	return {
		message: line,
		level: 'info',
		time: new Date(),
		timeInexact: true,
		...override,
	};
};

Package.logging = {
	Log,
};

export { Log };
