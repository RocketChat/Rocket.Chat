/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';

import { Package } from './package-registry';

const class2type: Record<string, string> = {};
const { toString } = class2type;
const hasOwn = Object.prototype.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

const isPlainObject = (obj: any): boolean => {
	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	const proto = getProto(obj);

	if (!proto) {
		return true;
	}

	const Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;

	return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};

const currentArgumentChecker = new Meteor.EnvironmentVariable<ArgumentChecker>();
const format = (result: { message: string; path?: string }) => {
	const err: any = new Match.Error(result.message);

	if (result.path) {
		err.message += ` in field ${result.path}`;
		err.path = result.path;
	}

	return err;
};

function check(value: any, pattern: any, options: { throwAllErrors?: boolean } = { throwAllErrors: false }) {
	const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();

	if (argChecker) {
		argChecker.checking(value);
	}

	const result = testSubtree(value, pattern, options.throwAllErrors);

	if (result) {
		if (options.throwAllErrors) {
			throw (result as any[]).map((r) => format(r));
		}

		throw format(result as any);
	}
}

class Optional {
	public pattern: any;

	constructor(pattern: any) {
		this.pattern = pattern;
	}
}

class Maybe {
	public pattern: any;

	constructor(pattern: any) {
		this.pattern = pattern;
	}
}

class OneOf {
	public choices: any[];

	constructor(choices: any[]) {
		if (!choices || choices.length === 0) {
			throw new Error('Must provide at least one choice to Match.OneOf');
		}

		this.choices = choices;
	}
}

class Where {
	public condition: (value: any) => any;

	constructor(condition: (value: any) => any) {
		this.condition = condition;
	}
}

class ObjectIncluding {
	public pattern: any;

	constructor(pattern: any) {
		this.pattern = pattern;
	}
}

class ObjectWithValues {
	public pattern: any;

	constructor(pattern: any) {
		this.pattern = pattern;
	}
}

const Match = {
	Optional(pattern: any) {
		return new Optional(pattern);
	},

	Maybe(pattern: any) {
		return new Maybe(pattern);
	},

	OneOf(...args: any[]) {
		return new OneOf(args);
	},
	Any: ['__any__'],
	Where(condition: (value: any) => any) {
		return new Where(condition);
	},

	ObjectIncluding(pattern: any) {
		return new ObjectIncluding(pattern);
	},

	ObjectWithValues(pattern: any) {
		return new ObjectWithValues(pattern);
	},
	Integer: ['__integer__'],
	Error: Meteor.makeErrorType('Match.Error', function (this: any, msg: string) {
		this.message = `Match error: ${msg}`;
		this.path = '';
		this.sanitizedError = new Meteor.Error(400, 'Match failed');
	}),

	test(value: any, pattern: any) {
		return !testSubtree(value, pattern);
	},

	_failIfArgumentsAreNotAllChecked(f: (...args: any[]) => any, context: any, args: any[], description: string) {
		const argChecker = new ArgumentChecker(args, description);
		const result = currentArgumentChecker.withValue(argChecker, () => f.apply(context, args));

		argChecker.throwUnlessAllArgumentsHaveBeenChecked();

		return result;
	},
};

const stringForErrorMessage = function (value: any, options: { onlyShowType?: boolean } = {}) {
	if (value === null) {
		return 'null';
	}

	if (options.onlyShowType) {
		return typeof value;
	}

	if (typeof value !== 'object') {
		return EJSON.stringify(value);
	}

	try {
		JSON.stringify(value);
	} catch (stringifyError: any) {
		if (stringifyError.name === 'TypeError') {
			return typeof value;
		}
	}

	return EJSON.stringify(value);
};

const typeofChecks: [any, string][] = [
	[String, 'string'],
	[Number, 'number'],
	[Boolean, 'boolean'],
	[Function, 'function'],
	[undefined, 'undefined'],
];

const testSubtree = function (
	value: any,
	pattern: any,
	collectErrors = false,
	errors: any[] = [],
	path = '',
): false | { message: string; path: string } | any[] {
	if (pattern === Match.Any) {
		return false;
	}

	for (let i = 0; i < typeofChecks.length; ++i) {
		if (pattern === typeofChecks[i][0]) {
			// eslint-disable-next-line valid-typeof
			if (typeof value === typeofChecks[i][1]) {
				return false;
			}

			return {
				message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, {
					onlyShowType: true,
				})}`,
				path: '',
			};
		}
	}

	if (pattern === null) {
		if (value === null) {
			return false;
		}

		return {
			message: `Expected null, got ${stringForErrorMessage(value)}`,
			path: '',
		};
	}

	if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
		if (value === pattern) {
			return false;
		}

		return {
			message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
			path: '',
		};
	}

	if (pattern === Match.Integer) {
		if (typeof value === 'number' && (value | 0) === value) {
			return false;
		}

		return {
			message: `Expected Integer, got ${stringForErrorMessage(value)}`,
			path: '',
		};
	}

	if (pattern === Object) {
		pattern = Match.ObjectIncluding({});
	}

	if (pattern instanceof Array) {
		if (pattern.length !== 1) {
			return {
				message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
				path: '',
			};
		}

		if (!Array.isArray(value) && !isArguments(value)) {
			return {
				message: `Expected array, got ${stringForErrorMessage(value)}`,
				path: '',
			};
		}

		for (let i = 0; i < value.length; i++) {
			const arrPath = `${path}[${i}]`;
			const result = testSubtree(value[i], pattern[0], collectErrors, errors, arrPath);

			if (result) {
				(result as any).path = _prependPath(collectErrors ? arrPath : i, (result as any).path);

				if (!collectErrors) return result;
				if (typeof value[i] !== 'object' || (result as any).message) errors.push(result);
			}
		}

		if (!collectErrors) return false;

		return errors.length === 0 ? false : errors;
	}

	if (pattern instanceof Where) {
		let result;

		try {
			result = pattern.condition(value);
		} catch (err: any) {
			if (!(err instanceof Match.Error)) {
				throw err;
			}

			return { message: err.message, path: (err as any).path };
		}

		if (result) {
			return false;
		}

		return { message: 'Failed Match.Where validation', path: '' };
	}

	if (pattern instanceof Maybe) {
		pattern = Match.OneOf(undefined, null, pattern.pattern);
	} else if (pattern instanceof Optional) {
		pattern = Match.OneOf(undefined, pattern.pattern);
	}

	if (pattern instanceof OneOf) {
		for (let i = 0; i < pattern.choices.length; ++i) {
			const result = testSubtree(value, pattern.choices[i]);

			if (!result) {
				return false;
			}
		}

		return {
			message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
			path: '',
		};
	}

	if (pattern instanceof Function) {
		if (value instanceof pattern) {
			return false;
		}

		return {
			message: `Expected ${pattern.name || 'particular constructor'}`,
			path: '',
		};
	}

	const unknownKeysAllowed = false;
	let unknownKeyPattern;

	if (pattern instanceof ObjectIncluding) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { pattern: _pattern } = pattern;
		pattern = _pattern;
	}

	if (pattern instanceof ObjectWithValues) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { pattern: _pattern } = pattern;
		unknownKeyPattern = [_pattern];
		pattern = {};
	}

	if (typeof pattern !== 'object') {
		return { message: 'Bad pattern: unknown pattern type', path: '' };
	}

	if (typeof value !== 'object') {
		return {
			message: `Expected object, got ${typeof value}`,
			path: '',
		};
	}

	if (value === null) {
		return { message: 'Expected object, got null', path: '' };
	}

	if (!isPlainObject(value)) {
		return { message: 'Expected plain object', path: '' };
	}

	const requiredPatterns = Object.create(null);
	const optionalPatterns = Object.create(null);

	Object.keys(pattern).forEach((key) => {
		const subPattern = pattern[key];

		if (subPattern instanceof Optional || subPattern instanceof Maybe) {
			optionalPatterns[key] = subPattern.pattern;
		} else {
			requiredPatterns[key] = subPattern;
		}
	});

	for (const key in Object(value)) {
		if (!hasOwn.call(value, key)) {
			continue;
		}
		const subValue = value[key];
		const objPath = path ? `${path}.${key}` : key;

		if (hasOwn.call(requiredPatterns, key)) {
			const result = testSubtree(subValue, requiredPatterns[key], collectErrors, errors, objPath);

			if (result) {
				(result as any).path = _prependPath(collectErrors ? objPath : key, (result as any).path);

				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || (result as any).message) errors.push(result);
			}

			delete requiredPatterns[key];
		} else if (hasOwn.call(optionalPatterns, key)) {
			const result = testSubtree(subValue, optionalPatterns[key], collectErrors, errors, objPath);

			if (result) {
				(result as any).path = _prependPath(collectErrors ? objPath : key, (result as any).path);

				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || (result as any).message) errors.push(result);
			}
		} else {
			if (!unknownKeysAllowed) {
				const result = { message: 'Unknown key', path: key };

				if (!collectErrors) return result;

				errors.push(result);
			}

			if (unknownKeyPattern) {
				const result = testSubtree(subValue, unknownKeyPattern[0], collectErrors, errors, objPath);

				if (result) {
					(result as any).path = _prependPath(collectErrors ? objPath : key, (result as any).path);

					if (!collectErrors) return result;
					if (typeof subValue !== 'object' || (result as any).message) errors.push(result);
				}
			}
		}
	}

	const keys = Object.keys(requiredPatterns);

	if (keys.length) {
		const createMissingError = (key: string) => ({
			message: `Missing key '${key}'`,
			path: collectErrors ? path : '',
		});

		if (!collectErrors) {
			return createMissingError(keys[0]);
		}

		for (const key of keys) {
			errors.push(createMissingError(key));
		}
	}

	if (!collectErrors) return false;

	return errors.length === 0 ? false : errors;
};

class ArgumentChecker {
	public args: any[];

	public description: string;

	constructor(args: any[], description: string) {
		this.args = [...args];
		this.args.reverse();
		this.description = description;
	}

	checking(value: any) {
		if (this._checkingOneValue(value)) {
			return;
		}

		if (Array.isArray(value) || isArguments(value)) {
			Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
		}
	}

	_checkingOneValue(value: any) {
		for (let i = 0; i < this.args.length; ++i) {
			if (value === this.args[i] || (Number.isNaN(value) && Number.isNaN(this.args[i]))) {
				this.args.splice(i, 1);

				return true;
			}
		}

		return false;
	}

	throwUnlessAllArgumentsHaveBeenChecked() {
		if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
	}
}

const _jsKeywords = [
	'do',
	'if',
	'in',
	'for',
	'let',
	'new',
	'try',
	'var',
	'case',
	'else',
	'enum',
	'eval',
	'false',
	'null',
	'this',
	'true',
	'void',
	'with',
	'break',
	'catch',
	'class',
	'const',
	'super',
	'throw',
	'while',
	'yield',
	'delete',
	'export',
	'import',
	'public',
	'return',
	'static',
	'switch',
	'typeof',
	'default',
	'extends',
	'finally',
	'package',
	'private',
	'continue',
	'debugger',
	'function',
	'arguments',
	'interface',
	'protected',
	'implements',
	'instanceof',
];

const _prependPath = (key: string | number, base: string) => {
	if (typeof key === 'number' || (typeof key === 'string' && key.match(/^[0-9]+$/))) {
		key = `[${key}]`;
	} else if (!key.toString().match(/^[a-z_$][0-9a-z_$.[\]]*$/i) || _jsKeywords.indexOf(key.toString()) >= 0) {
		key = JSON.stringify([key]);
	}

	if (base && base[0] !== '[') {
		return `${key}.${base}`;
	}

	return key + base;
};

const isObject = (value: any) => typeof value === 'object' && value !== null;
const baseIsArguments = (item: any) => isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';

const isArguments = baseIsArguments(
	(function () {
		// eslint-disable-next-line
		return arguments;
	})(),
)
	? baseIsArguments
	: (value: any) => isObject(value) && typeof value.callee === 'function';

export { Match, check };

Package.check = { Match, check };
