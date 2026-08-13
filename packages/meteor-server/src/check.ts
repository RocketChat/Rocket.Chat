/* Port of meteor/check (packages/check/match.js @ METEOR@3.4.1) */
import { EJSON } from '@rocket.chat/meteor-client/ejson';

import { EnvironmentVariable, MeteorError, makeErrorType } from './meteor.ts';

const currentArgumentChecker = new EnvironmentVariable<ArgumentChecker>();
const hasOwn = Object.prototype.hasOwnProperty;

type MatchFailure = { message: string; path: string };

const format = (result: MatchFailure) => {
	const err = new (Match.Error as any)(result.message);
	if (result.path) {
		err.message += ` in field ${result.path}`;
		err.path = result.path;
	}
	return err;
};

function nonEmptyStringCondition(value: unknown): boolean {
	check(value, String);
	return (value as string).length > 0;
}

export function check(value: any, pattern: any, options: { throwAllErrors?: boolean } = { throwAllErrors: false }): void {
	const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();
	if (argChecker) {
		argChecker.checking(value);
	}

	const result = testSubtree(value, pattern, options.throwAllErrors);

	if (result) {
		if (options.throwAllErrors) {
			throw Array.isArray(result) ? result.map((r) => format(r)) : [format(result)];
		} else {
			throw format(result as MatchFailure);
		}
	}
}

export const Match = {
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

	Where(condition: (value: any) => boolean) {
		return new Where(condition);
	},

	NonEmptyString: ['__NonEmptyString__'],

	ObjectIncluding(pattern: any) {
		return new ObjectIncluding(pattern);
	},

	ObjectWithValues(pattern: any) {
		return new ObjectWithValues(pattern);
	},

	// Matches only signed 32-bit integers
	Integer: ['__integer__'],

	Error: makeErrorType('Match.Error', function (this: any, msg: string) {
		this.message = `Match error: ${msg}`;
		// The path of the value that failed to match. Initially empty, this gets
		// populated by catching and rethrowing the exception as it goes back up
		// the stack. E.g.: "vals[3].entity.created"
		this.path = '';
		// If this gets sent over DDP, don't give full internal details but at
		// least provide something better than 500 Internal server error.
		this.sanitizedError = new MeteorError(400, 'Match failed');
	}),

	test(value: any, pattern: any): boolean {
		return !testSubtree(value, pattern);
	},

	_failIfArgumentsAreNotAllChecked(f: (...args: any[]) => any, context: any, args: any[], description: string) {
		const argChecker = new ArgumentChecker(args, description);
		const result = currentArgumentChecker.withValue(argChecker, () => f.apply(context, args));

		// If f didn't itself throw, make sure it checked all of its arguments.
		argChecker.throwUnlessAllArgumentsHaveBeenChecked();
		return result;
	},
};

class Optional {
	constructor(public pattern: any) {}
}

class Maybe {
	constructor(public pattern: any) {}
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
	constructor(public condition: (value: any) => boolean) {}
}

class ObjectIncluding {
	constructor(public pattern: any) {}
}

class ObjectWithValues {
	constructor(public pattern: any) {}
}

const stringForErrorMessage = (value: any, options: { onlyShowType?: boolean } = {}): string => {
	if (value === null) {
		return 'null';
	}

	if (options.onlyShowType) {
		return typeof value;
	}

	// Your average non-object things. Saves from doing the try/catch below for.
	if (typeof value !== 'object') {
		return EJSON.stringify(value);
	}

	try {
		// Find objects with circular references since EJSON doesn't support them.
		// If the native stringify is going to choke, EJSON.stringify is going to choke too.
		JSON.stringify(value);
	} catch (stringifyError) {
		if ((stringifyError as Error).name === 'TypeError') {
			return typeof value;
		}
	}

	return EJSON.stringify(value);
};

const typeofChecks: Array<[any, string]> = [
	[String, 'string'],
	[Number, 'number'],
	[Boolean, 'boolean'],
	// While we don't allow undefined/function in EJSON, this is good for
	// optional arguments with OneOf.
	[Function, 'function'],
	[undefined, 'undefined'],
];

// Return `false` if it matches. Otherwise, returns an object with `message`
// and `path` fields, or an array of those when collecting errors.
const testSubtree = (
	value: any,
	pattern: any,
	collectErrors = false,
	errors: MatchFailure[] = [],
	path = '',
): false | MatchFailure | MatchFailure[] => {
	// Match anything!
	if (pattern === Match.Any) {
		return false;
	}

	// Basic atomic types.
	// Do not match boxed objects (e.g. String, Boolean)
	for (let i = 0; i < typeofChecks.length; ++i) {
		if (pattern === typeofChecks[i][0]) {
			if (typeof value === typeofChecks[i][1]) {
				return false;
			}

			return {
				message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, { onlyShowType: true })}`,
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

	// Strings, numbers, and booleans match literally. Goes well with Match.OneOf.
	if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
		if (value === pattern) {
			return false;
		}

		return {
			message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
			path: '',
		};
	}

	// Match.Integer is special type encoded with array
	if (pattern === Match.Integer) {
		// Bitwise operators work consistently but always cast variable to 32-bit
		// signed integer according to JavaScript specs.
		if (typeof value === 'number' && (value | 0) === value) {
			return false;
		}

		return {
			message: `Expected Integer, got ${stringForErrorMessage(value)}`,
			path: '',
		};
	}

	// 'Object' is shorthand for Match.ObjectIncluding({});
	if (pattern === Object) {
		pattern = Match.ObjectIncluding({});
	}

	// This must be invoked before pattern instanceof Array as strings are regarded as arrays
	if (pattern === Match.NonEmptyString) {
		pattern = new Where(nonEmptyStringCondition);
	}

	// Array (checked AFTER Any, which is implemented as an Array).
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

		for (let i = 0, length = value.length; i < length; i++) {
			const arrPath = `${path}[${i}]`;
			const result = testSubtree(value[i], pattern[0], collectErrors, errors, arrPath) as MatchFailure;
			if (result) {
				result.path = _prependPath(collectErrors ? arrPath : i, result.path);
				if (!collectErrors) return result;
				if (typeof value[i] !== 'object' || result.message) errors.push(result);
			}
		}

		if (!collectErrors) return false;
		return errors.length === 0 ? false : errors;
	}

	// Arbitrary validation checks. The condition can return false or throw a
	// Match.Error (ie, it can internally use check()) to fail.
	if (pattern instanceof Where) {
		let result;
		try {
			result = pattern.condition(value);
		} catch (err) {
			if (!(err instanceof (Match.Error as any))) {
				throw err;
			}

			return {
				message: (err as any).message,
				path: (err as any).path,
			};
		}

		if (result) {
			return false;
		}

		return {
			message: 'Failed Match.Where validation',
			path: '',
		};
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
				// No error? Yay, return.
				return false;
			}
			// Match errors just mean try another choice.
		}

		return {
			message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
			path: '',
		};
	}

	// A function that isn't something we special-case is assumed to be a constructor.
	if (pattern instanceof Function) {
		if (value instanceof pattern) {
			return false;
		}

		return {
			message: `Expected ${pattern.name || 'particular constructor'}`,
			path: '',
		};
	}

	let unknownKeysAllowed = false;
	let unknownKeyPattern;
	if (pattern instanceof ObjectIncluding) {
		unknownKeysAllowed = true;
		pattern = pattern.pattern;
	}

	if (pattern instanceof ObjectWithValues) {
		unknownKeysAllowed = true;
		unknownKeyPattern = [pattern.pattern];
		pattern = {}; // no required keys
	}

	if (typeof pattern !== 'object') {
		return {
			message: 'Bad pattern: unknown pattern type',
			path: '',
		};
	}

	// An object, with required and optional keys. Note that this does NOT do
	// structural matches against objects of special types that happen to match
	// the pattern: this really needs to be a plain old {Object}!
	if (typeof value !== 'object') {
		return {
			message: `Expected object, got ${typeof value}`,
			path: '',
		};
	}

	if (value === null) {
		return {
			message: `Expected object, got null`,
			path: '',
		};
	}

	if (!isPlainObject(value)) {
		return {
			message: `Expected plain object`,
			path: '',
		};
	}

	const requiredPatterns: Record<string, any> = Object.create(null);
	const optionalPatterns: Record<string, any> = Object.create(null);

	Object.keys(pattern).forEach((key) => {
		const subPattern = pattern[key];
		if (subPattern instanceof Optional || subPattern instanceof Maybe) {
			optionalPatterns[key] = subPattern.pattern;
		} else {
			requiredPatterns[key] = subPattern;
		}
	});

	for (const key in Object(value)) {
		const subValue = value[key];
		const objPath = path ? `${path}.${key}` : key;
		if (hasOwn.call(requiredPatterns, key)) {
			const result = testSubtree(subValue, requiredPatterns[key], collectErrors, errors, objPath) as MatchFailure;
			if (result) {
				result.path = _prependPath(collectErrors ? objPath : key, result.path);
				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || result.message) errors.push(result);
			}

			delete requiredPatterns[key];
		} else if (hasOwn.call(optionalPatterns, key)) {
			const result = testSubtree(subValue, optionalPatterns[key], collectErrors, errors, objPath) as MatchFailure;
			if (result) {
				result.path = _prependPath(collectErrors ? objPath : key, result.path);
				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || result.message) errors.push(result);
			}
		} else {
			if (!unknownKeysAllowed) {
				const result = {
					message: 'Unknown key',
					path: key,
				};
				if (!collectErrors) return result;
				errors.push(result);
			}

			if (unknownKeyPattern) {
				const result = testSubtree(subValue, unknownKeyPattern[0], collectErrors, errors, objPath) as MatchFailure;
				if (result) {
					result.path = _prependPath(collectErrors ? objPath : key, result.path);
					if (!collectErrors) return result;
					if (typeof subValue !== 'object' || result.message) errors.push(result);
				}
			}
		}
	}

	const keys = Object.keys(requiredPatterns);
	if (keys.length) {
		const createMissingError = (key: string): MatchFailure => ({
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
	private args: any[];

	private description: string;

	constructor(args: any[], description: string) {
		// Make a SHALLOW copy of the arguments. (We'll be doing identity checks
		// against its contents.)
		this.args = [...args];

		// Since the common case will be to check arguments in order, and we splice
		// out arguments when we check them, make it so we splice out from the end
		// rather than the beginning.
		this.args.reverse();
		this.description = description;
	}

	checking(value: any) {
		if (this._checkingOneValue(value)) {
			return;
		}

		// Allow check(arguments, [String]) or check(arguments.slice(1), [String])
		// or check([foo, bar], [String]) to count... but only if value wasn't
		// itself an argument.
		if (Array.isArray(value) || isArguments(value)) {
			Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
		}
	}

	_checkingOneValue(value: any): boolean {
		for (let i = 0; i < this.args.length; ++i) {
			// Is this value one of the arguments? (This can have a false positive if
			// the argument is an interned primitive, but it's still a good enough
			// check.)
			// (NaN is not === to itself, so we have to check specially.)
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
	'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case',
	'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with',
	'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield',
	'delete', 'export', 'import', 'public', 'return', 'static', 'switch',
	'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue',
	'debugger', 'function', 'arguments', 'interface', 'protected', 'implements',
	'instanceof',
];

// Assumes the base of path is already escaped properly
// returns key + base
const _prependPath = (key: string | number, base: string): string => {
	if (typeof key === 'number' || key.match(/^[0-9]+$/)) {
		key = `[${key}]`;
	} else if (!key.match(/^[a-z_$][0-9a-z_$.[\]]*$/i) || _jsKeywords.indexOf(key) >= 0) {
		key = JSON.stringify([key]);
	}

	if (base && base[0] !== '[') {
		return `${key}.${base}`;
	}

	return key + base;
};

const isObject = (value: any) => typeof value === 'object' && value !== null;

const isArguments = (value: any) => isObject(value) && Object.prototype.toString.call(value) === '[object Arguments]';

/* Port of packages/check/isPlainObject.js — jQuery-derived plain object check */
const fnToString = Function.prototype.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

function isPlainObject(obj: any): boolean {
	if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
		return false;
	}

	const proto = getProto(obj);

	// Objects with no prototype (e.g., `Object.create(null)`) are plain
	if (!proto) {
		return true;
	}

	// Objects with prototype are plain iff they were constructed by a global Object function
	const Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
	return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
}
