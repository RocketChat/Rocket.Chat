import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry';
import { hasOwn } from './utils/hasOwn.ts';
import { isFunction } from './utils/isFunction.ts';
import { isObject } from './utils/isObject.ts';

// --- Types ---

type ValidationError = {
	message: string;
	path: string;
};

// Success is false (no error), failure is an error object or array of objects
type ValidationResult = null | false | ValidationError | ValidationError[];

type Pattern =
	| StringConstructor
	| NumberConstructor
	| BooleanConstructor
	| FunctionConstructor
	| DateConstructor
	| string
	| number
	| boolean
	| null
	| undefined
	| Pattern[]
	| { [key: string]: Pattern }
	| Matcher
	| (new (...args: any[]) => any); // For custom class constructors

type Matcher = {
	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult;
};

// --- Utils ---

const class2type: Record<string, string> = {};
const { toString } = class2type;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	const proto = getProto(obj);
	if (!proto) {
		return true;
	}

	const Ctor = hasOwn(proto, 'constructor') && proto.constructor;
	return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};

// --- Argument Checker ---

class ArgumentChecker {
	public args: unknown[];

	public description: string;

	constructor(args: unknown[], description: string) {
		this.args = [...args];
		this.args.reverse();
		this.description = description;
	}

	checking(value: unknown): void {
		if (this._checkingOneValue(value)) {
			return;
		}

		if (Array.isArray(value) || isArguments(value)) {
			Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
		}
	}

	_checkingOneValue(value: unknown): boolean {
		for (let i = 0; i < this.args.length; ++i) {
			if (value === this.args[i] || (Number.isNaN(value) && Number.isNaN(this.args[i] as number))) {
				this.args.splice(i, 1);
				return true;
			}
		}
		return false;
	}

	throwUnlessAllArgumentsHaveBeenChecked(): void {
		if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
	}
}

const currentArgumentChecker = new Meteor.EnvironmentVariable<ArgumentChecker>();

// --- Error Formatting ---

const formatError = (result: ValidationError) => {
	const err = new Match.Error(result.message) as MatchError;
	if (result.path) {
		err.message += ` in field ${result.path}`;
		err.path = result.path;
	}
	return err;
};

const stringForErrorMessage = (value: unknown, options: { onlyShowType?: boolean } = {}): string => {
	if (value === null) return 'null';
	if (options.onlyShowType) return typeof value;
	if (typeof value !== 'object') return EJSON.stringify(value);

	try {
		JSON.stringify(value);
	} catch (stringifyError: unknown) {
		if (stringifyError instanceof TypeError) {
			return typeof value;
		}
	}
	return EJSON.stringify(value);
};

// --- Matcher Classes ---

class Optional implements Matcher {
	constructor(public pattern: Pattern) {}

	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult {
		if (value === undefined) return false;
		return validateFn(value, this.pattern);
	}
}

class Maybe implements Matcher {
	constructor(public pattern: Pattern) {}

	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult {
		if (value === undefined || value === null) return false;
		return validateFn(value, this.pattern);
	}
}

class OneOf implements Matcher {
	public choices: Pattern[];

	constructor(choices: Pattern[]) {
		if (!choices || choices.length === 0) {
			throw new Error('Must provide at least one choice to Match.OneOf');
		}
		this.choices = choices;
	}

	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult {
		for (const choice of this.choices) {
			if (!validateFn(value, choice)) {
				return false;
			}
		}
		return {
			message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
			path: '',
		};
	}
}

class Where implements Matcher {
	constructor(public condition: (value: unknown) => boolean | ValidationError) {}

	validate(value: unknown): ValidationResult {
		let result;
		try {
			result = this.condition(value);
		} catch (err: unknown) {
			if (err instanceof Match.Error) {
				return { message: err.message, path: (err as MatchError).path || '' };
			}
			throw err;
		}

		if (result) return false;
		return { message: 'Failed Match.Where validation', path: '' };
	}
}

class ObjectIncluding implements Matcher {
	constructor(public pattern: Record<string, Pattern>) {}

	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult {
		return validateObject(value, this.pattern, true, validateFn);
	}
}

class ObjectWithValues implements Matcher {
	constructor(public pattern: Pattern) {}

	validate(value: unknown, validateFn: typeof testSubtree): ValidationResult {
		return validateObjectWithValues(value, this.pattern, validateFn);
	}
}

// --- Validation Logic ---

const typeofChecks = [
	[String, 'string'],
	[Number, 'number'],
	[Boolean, 'boolean'],
	[Function, 'function'],
	[undefined, 'undefined'],
] as const;

const checkPrimitive = (value: unknown, pattern: unknown): ValidationResult => {
	for (const [typeConstructor, typeName] of typeofChecks) {
		if (pattern === typeConstructor) {
			// eslint-disable-next-line valid-typeof
			if (typeof value === typeName) return false;
			return {
				message: `Expected ${typeName}, got ${stringForErrorMessage(value, { onlyShowType: true })}`,
				path: '',
			};
		}
	}
	return null; // Not a primitive check
};

const checkLiteral = (value: unknown, pattern: unknown): ValidationResult => {
	if (pattern === null) {
		return value === null ? false : { message: `Expected null, got ${stringForErrorMessage(value)}`, path: '' };
	}

	if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
		return value === pattern ? false : { message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`, path: '' };
	}

	return null; // Not a literal check
};

const validateArray = (
	value: unknown,
	pattern: Pattern[],
	collectErrors: boolean,
	errors: ValidationError[],
	path: string,
): ValidationResult => {
	if (pattern.length !== 1) {
		return {
			message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
			path: '',
		};
	}

	if (!Array.isArray(value) && !isArguments(value)) {
		return { message: `Expected array, got ${stringForErrorMessage(value)}`, path: '' };
	}

	// We know value is array-like here
	const arrayValue = value as unknown[];

	for (let i = 0; i < arrayValue.length; i++) {
		const arrPath = `${path}[${i}]`;
		const result = testSubtree(arrayValue[i], pattern[0], collectErrors, errors, arrPath);

		if (result) {
			const errorResult = result as ValidationError;
			errorResult.path = _prependPath(collectErrors ? arrPath : i, errorResult.path);

			if (!collectErrors) return result;
			if (typeof arrayValue[i] !== 'object' || errorResult.message) errors.push(errorResult);
		}
	}

	if (!collectErrors) return false;
	return errors.length === 0 ? false : errors;
};

const validateObjectWithValues = (value: unknown, valuePattern: Pattern, validateFn: typeof testSubtree): ValidationResult => {
	if (typeof value !== 'object' || value === null) {
		return { message: `Expected object, got ${value === null ? 'null' : typeof value}`, path: '' };
	}
	if (!isPlainObject(value)) {
		return { message: 'Expected plain object', path: '' };
	}

	// In ObjectWithValues, every value in the object must match the pattern
	for (const key in value) {
		if (hasOwn(value, key)) {
			const result = validateFn((value as Record<string, unknown>)[key], valuePattern);
			if (result) return result;
		}
	}
	return false;
};

const validateObject = (
	value: unknown,
	pattern: Record<string, Pattern>,
	unknownKeysAllowed: boolean,
	validateFn: typeof testSubtree,
	collectErrors = false,
	errors: ValidationError[] = [],
	path = '',
): ValidationResult => {
	if (typeof value !== 'object' || value === null) {
		return { message: `Expected object, got ${value === null ? 'null' : typeof value}`, path: '' };
	}
	if (!isPlainObject(value)) {
		return { message: 'Expected plain object', path: '' };
	}

	const requiredPatterns: Record<string, Pattern> = Object.create(null);
	const optionalPatterns: Record<string, Pattern> = Object.create(null);

	// Classify patterns
	for (const key of Object.keys(pattern)) {
		const subPattern = pattern[key];
		if (subPattern instanceof Optional || subPattern instanceof Maybe) {
			optionalPatterns[key] = subPattern.pattern;
		} else {
			requiredPatterns[key] = subPattern;
		}
	}

	const objectValue = value as Record<string, unknown>;

	for (const key in objectValue) {
		if (!hasOwn(objectValue, key)) continue;

		const subValue = objectValue[key];
		const objPath = path ? `${path}.${key}` : key;
		let result: ValidationResult = false;

		if (hasOwn(requiredPatterns, key)) {
			result = validateFn(subValue, requiredPatterns[key], collectErrors, errors, objPath);
			delete requiredPatterns[key];
		} else if (hasOwn(optionalPatterns, key)) {
			result = validateFn(subValue, optionalPatterns[key], collectErrors, errors, objPath);
		} else if (!unknownKeysAllowed) {
			result = { message: 'Unknown key', path: key };
			if (collectErrors) errors.push(result as ValidationError);
			else return result;
		}

		if (result) {
			const res = result as ValidationError;
			res.path = _prependPath(collectErrors ? objPath : key, res.path);
			if (!collectErrors) return res;
			if (typeof subValue !== 'object' || res.message) errors.push(res);
		}
	}

	// Check for missing required keys
	const missingKeys = Object.keys(requiredPatterns);
	if (missingKeys.length) {
		const createMissingError = (key: string) => ({
			message: `Missing key '${key}'`,
			path: collectErrors ? path : '',
		});

		if (!collectErrors) return createMissingError(missingKeys[0]);

		for (const key of missingKeys) {
			errors.push(createMissingError(key));
		}
	}

	if (!collectErrors) return false;
	return errors.length === 0 ? false : errors;
};

// --- Main Validation Function ---

const testSubtree = (
	value: unknown,
	pattern: Pattern,
	collectErrors = false,
	errors: ValidationError[] = [],
	path = '',
): ValidationResult => {
	// 1. Any
	if (pattern === Match.Any) return false;

	// 2. Primitives (Constructors)
	const primitiveResult = checkPrimitive(value, pattern);
	if (primitiveResult !== null) return primitiveResult;

	// 3. Literals
	const literalResult = checkLiteral(value, pattern);
	if (literalResult !== null) return literalResult;

	// 4. Integer Special Case
	if (pattern === Match.Integer) {
		if (typeof value === 'number' && (value | 0) === value) return false;
		return { message: `Expected Integer, got ${stringForErrorMessage(value)}`, path: '' };
	}

	// 5. Object (Generic)
	if (pattern === Object) {
		return validateObject(value, {}, true, testSubtree, collectErrors, errors, path);
	}

	// 6. Arrays
	if (Array.isArray(pattern)) {
		return validateArray(value, pattern, collectErrors, errors, path);
	}

	// 7. Matcher Objects (Optional, Maybe, OneOf, Where, ObjectIncluding)
	// We check if it satisfies the Matcher interface (has validate method)
	if (typeof pattern === 'object' && pattern !== null && 'validate' in pattern && isFunction((pattern as Matcher).validate)) {
		return (pattern as Matcher).validate(value, testSubtree);
	}

	// 8. Custom Constructors (instanceof check)
	if (pattern instanceof Function) {
		if (value instanceof pattern) return false;
		return { message: `Expected ${pattern.name || 'particular constructor'}`, path: '' };
	}

	// 9. Plain Objects (Strict structure)
	if (typeof pattern === 'object' && pattern !== null) {
		return validateObject(value, pattern as Record<string, Pattern>, false, testSubtree, collectErrors, errors, path);
	}

	return { message: 'Bad pattern: unknown pattern type', path: '' };
};

// --- Public API ---

function check(value: unknown, pattern: Pattern, options: { throwAllErrors?: boolean } = { throwAllErrors: false }): void {
	const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();
	if (argChecker) {
		argChecker.checking(value);
	}

	const result = testSubtree(value, pattern, options.throwAllErrors);

	if (result) {
		if (Array.isArray(result) && options.throwAllErrors) {
			throw result.map((r) => formatError(r));
		}
		throw formatError(result as ValidationError);
	}
}

type MatchError = Error & {
	path?: string;
	sanitizedError?: Error;
};

const Match = {
	Optional(pattern: Pattern) {
		return new Optional(pattern);
	},
	Maybe(pattern: Pattern) {
		return new Maybe(pattern);
	},
	OneOf(...args: Pattern[]) {
		return new OneOf(args);
	},
	Any: ['__any__'] as unknown as Pattern,
	Where(condition: (value: unknown) => boolean | ValidationError) {
		return new Where(condition);
	},
	ObjectIncluding(pattern: Record<string, Pattern>) {
		return new ObjectIncluding(pattern);
	},
	ObjectWithValues(pattern: Pattern) {
		return new ObjectWithValues(pattern);
	},
	Integer: ['__integer__'] as unknown as Pattern,

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Error: Meteor.makeErrorType('Match.Error', function (this: any, msg: string) {
		this.message = `Match error: ${msg}`;
		this.path = '';
		this.sanitizedError = new Meteor.Error(400, 'Match failed');
	}),

	test(value: unknown, pattern: Pattern): boolean {
		return !testSubtree(value, pattern);
	},

	_failIfArgumentsAreNotAllChecked(f: (...args: unknown[]) => unknown, context: unknown, args: unknown[], description: string): unknown {
		const argChecker = new ArgumentChecker(args, description);
		const result = currentArgumentChecker.withValue(argChecker, () => f.apply(context, args));
		argChecker.throwUnlessAllArgumentsHaveBeenChecked();
		return result;
	},
};

// --- Internal Helper Constants ---

const _jsKeywords = new Set([
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
]);

const _prependPath = (key: string | number, base: string): string => {
	let keyStr = key.toString();
	if (typeof key === 'number' || keyStr.match(/^[0-9]+$/)) {
		keyStr = `[${key}]`;
	} else if (!keyStr.match(/^[a-z_$][0-9a-z_$.[\]]*$/i) || _jsKeywords.has(keyStr)) {
		keyStr = JSON.stringify([keyStr]);
	}

	if (base && base[0] !== '[') {
		return `${keyStr}.${base}`;
	}
	return keyStr + base;
};

const baseIsArguments = (item: unknown): item is IArguments =>
	isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';

const isArguments = baseIsArguments(
	(function () {
		// eslint-disable-next-line prefer-rest-params
		return arguments;
	})(),
)
	? baseIsArguments
	: (value: unknown): value is IArguments => isObject(value) && hasOwn(value, 'callee') && isFunction((value as any).callee);

export { Match, check };

Package.check = { Match, check };
