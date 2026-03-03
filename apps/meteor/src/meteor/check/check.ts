const class2type: Record<string, string> = {};
const toString = class2type.toString;
const hasOwn = Object.prototype.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;

const isPlainObject = (obj: any): boolean => {
	let proto;
	let Ctor;

	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	proto = getProto(obj);

	if (!proto) {
		return true;
	}

	Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
	return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};

export type Matcher<_T> = {
	_meteorCheckMatcherBrand: void;
};

export type Pattern =
	| typeof String
	| typeof Number
	| typeof Boolean
	| typeof Object
	| typeof Function
	| (new (...args: any[]) => any)
	| undefined
	| null
	| string
	| number
	| boolean
	| [Pattern]
	| { [key: string]: Pattern }
	| Matcher<any>;

export type PatternMatch<T extends Pattern> =
	T extends Matcher<infer U> ? U :
	T extends typeof String ? string :
	T extends typeof Number ? number :
	T extends typeof Boolean ? boolean :
	T extends typeof Object ? object :
	T extends typeof Function ? Function :
	T extends undefined | null | string | number | boolean ? T :
	T extends new (...args: any[]) => infer U ? U :
	T extends [Pattern] ? PatternMatch<T[0]>[] :
	T extends { [key: string]: Pattern } ? { [K in keyof T]: PatternMatch<T[K]> } :
	unknown;

export class MatchError extends Error {
	public path: string;
	public sanitizedError: Error;

	constructor(msg: string) {
		super(`Match error: ${msg}`);
		this.name = 'MatchError';
		this.path = '';
		this.sanitizedError = new Error('Match failed'); // Replaces Meteor.Error(400)
	}
}

const format = (result: { message: string; path?: string }): MatchError => {
	const err = new MatchError(result.message.replace(/^Match error: /, ''));
	if (result.path) {
		err.message += ` in field ${result.path}`;
		err.path = result.path;
	}
	return err;
};

function nonEmptyStringCondition(value: any): boolean {
	check(value, String);
	return value.length > 0;
}

export function check<T extends Pattern>(
	value: any,
	pattern: T,
	options: { throwAllErrors?: boolean } = { throwAllErrors: false }
): asserts value is PatternMatch<T> {
	const result = testSubtree(value, pattern, options.throwAllErrors);

	if (result) {
		if (options.throwAllErrors) {
			throw Array.isArray(result) ? result.map((r) => format(r)) : [format(result)];
		} else {
			throw format(result);
		}
	}
}

class Optional {
	pattern: Pattern;
	constructor(pattern: Pattern) {
		this.pattern = pattern;
	}
}

class Maybe {
	pattern: Pattern;
	constructor(pattern: Pattern) {
		this.pattern = pattern;
	}
}

class OneOf {
	public choices: Pattern[];
	constructor(choices: Pattern[]) {
		if (!choices || choices.length === 0) {
			throw new Error('Must provide at least one choice to Match.OneOf');
		}
		this.choices = choices;
	}
}

class Where {
	condition: (val: any) => boolean;
	constructor(condition: (val: any) => boolean) {
		this.condition = condition;
	}
}

class ObjectIncluding {
	pattern: Record<string, Pattern>;
	constructor(pattern: Record<string, Pattern>) {
		this.pattern = pattern;
	}
}

class ObjectWithValues {
	pattern: Pattern;
	constructor(pattern: Pattern) {
		this.pattern = pattern;
	}
}

export const Match = {
	Optional: <T extends Pattern>(pattern: T): Matcher<PatternMatch<T> | undefined> => new Optional(pattern) as any,
	Maybe: <T extends Pattern>(pattern: T): Matcher<PatternMatch<T> | undefined | null> => new Maybe(pattern) as any,
	OneOf: <T extends Pattern[]>(...args: T): Matcher<PatternMatch<T[number]>> => new OneOf(args) as any,
	Any: ['__any__'] as unknown as Matcher<any>,
	Where: <T>(condition: (val: any) => boolean): Matcher<T> => new Where(condition) as any,
	NonEmptyString: ['__NonEmptyString__'] as unknown as Matcher<string>,
	ObjectIncluding: <T extends { [key: string]: Pattern }>(pattern: T): Matcher<PatternMatch<T>> => new ObjectIncluding(pattern) as any,
	ObjectWithValues: <T extends Pattern>(pattern: T): Matcher<Record<string, PatternMatch<T>>> => new ObjectWithValues(pattern) as any,
	Integer: ['__integer__'] as unknown as Matcher<number>,
	Error: MatchError,

	test<T extends Pattern>(value: any, pattern: T): value is PatternMatch<T> {
		return !testSubtree(value, pattern);
	}
};

const stringForErrorMessage = (value: any, options: { onlyShowType?: boolean } = {}): string => {
	if (value === null) return 'null';
	if (options.onlyShowType) return typeof value;
	if (typeof value !== 'object') return JSON.stringify(value);

	try {
		return JSON.stringify(value);
	} catch (stringifyError) {
		if (stringifyError instanceof TypeError) {
			return typeof value;
		}
		return '[Circular]';
	}
};

const typeofChecks: Array<[any, string]> = [
	[String, 'string'],
	[Number, 'number'],
	[Boolean, 'boolean'],
	[Function, 'function'],
	[undefined, 'undefined'],
];

const testSubtree = (
	value: any,
	pattern: any,
	collectErrors: boolean = false,
	errors: any[] = [],
	path: string = ''
): any => {
	if (pattern === Match.Any) return false;

	for (let i = 0; i < typeofChecks.length; ++i) {
		if (pattern === typeofChecks[i][0]) {
			if (typeof value === typeofChecks[i][1]) return false;
			return { message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, { onlyShowType: true })}`, path: '' };
		}
	}

	if (pattern === null) {
		if (value === null) return false;
		return { message: `Expected null, got ${stringForErrorMessage(value)}`, path: '' };
	}

	if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
		if (value === pattern) return false;
		return { message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`, path: '' };
	}

	if (pattern === Match.Integer) {
		if (typeof value === 'number' && (value | 0) === value) return false;
		return { message: `Expected Integer, got ${stringForErrorMessage(value)}`, path: '' };
	}

	if (pattern === Object) {
		pattern = Match.ObjectIncluding({});
	}

	if (pattern === Match.NonEmptyString) {
		pattern = new Where(nonEmptyStringCondition);
	}

	if (Array.isArray(pattern)) {
		if (pattern.length !== 1) {
			return { message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`, path: '' };
		}
		if (!Array.isArray(value) && !isArguments(value)) {
			return { message: `Expected array, got ${stringForErrorMessage(value)}`, path: '' };
		}

		for (let i = 0, length = value.length; i < length; i++) {
			const arrPath = `${path}[${i}]`;
			const result = testSubtree(value[i], pattern[0], collectErrors, errors, arrPath);
			if (result) {
				result.path = _prependPath(collectErrors ? arrPath : i, result.path);
				if (!collectErrors) return result;
				if (typeof value[i] !== 'object' || result.message) errors.push(result);
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
			if (!(err instanceof MatchError)) throw err;
			return { message: err.message.replace(/^Match error: /, ''), path: err.path };
		}
		if (result) return false;
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
			if (!result) return false;
		}
		return { message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation', path: '' };
	}

	if (pattern instanceof Function) {
		if (value instanceof pattern) return false;
		return { message: `Expected ${pattern.name || 'particular constructor'}`, path: '' };
	}

	let unknownKeysAllowed = false;
	let unknownKeyPattern: any;

	if (pattern instanceof ObjectIncluding) {
		unknownKeysAllowed = true;
		pattern = pattern.pattern;
	}

	if (pattern instanceof ObjectWithValues) {
		unknownKeysAllowed = true;
		unknownKeyPattern = [pattern.pattern];
		pattern = {};
	}

	if (typeof pattern !== 'object') {
		return { message: 'Bad pattern: unknown pattern type', path: '' };
	}

	if (typeof value !== 'object') return { message: `Expected object, got ${typeof value}`, path: '' };
	if (value === null) return { message: `Expected object, got null`, path: '' };
	if (!isPlainObject(value)) return { message: `Expected plain object`, path: '' };

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
		const subValue = value[key];
		const objPath = path ? `${path}.${key}` : key;

		if (hasOwn.call(requiredPatterns, key)) {
			const result = testSubtree(subValue, requiredPatterns[key], collectErrors, errors, objPath);
			if (result) {
				result.path = _prependPath(collectErrors ? objPath : key, result.path);
				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || result.message) errors.push(result);
			}
			delete requiredPatterns[key];
		} else if (hasOwn.call(optionalPatterns, key)) {
			const result = testSubtree(subValue, optionalPatterns[key], collectErrors, errors, objPath);
			if (result) {
				result.path = _prependPath(collectErrors ? objPath : key, result.path);
				if (!collectErrors) return result;
				if (typeof subValue !== 'object' || result.message) errors.push(result);
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
					result.path = _prependPath(collectErrors ? objPath : key, result.path);
					if (!collectErrors) return result;
					if (typeof subValue !== 'object' || result.message) errors.push(result);
				}
			}
		}
	}

	const keys = Object.keys(requiredPatterns);
	if (keys.length) {
		const createMissingError = (key: string) => ({ message: `Missing key '${key}'`, path: collectErrors ? path : '' });
		if (!collectErrors) return createMissingError(keys[0]);
		for (const key of keys) errors.push(createMissingError(key));
	}

	if (!collectErrors) return false;
	return errors.length === 0 ? false : errors;
};

const _jsKeywords = [
	'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'false', 'null', 'this', 'true', 'void', 'with', 'break', 'catch', 'class', 'const', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof'
];

const _prependPath = (key: string | number, base: string): string => {
	let strKey = String(key);
	if (typeof key === 'number' || strKey.match(/^[0-9]+$/)) {
		strKey = `[${key}]`;
	} else if (!strKey.match(/^[a-z_$][0-9a-z_$.[\]]*$/i) || _jsKeywords.includes(strKey)) {
		strKey = JSON.stringify([key]);
	}

	if (base && base[0] !== '[') return `${strKey}.${base}`;
	return strKey + base;
};

const isObject = (value: any): boolean => typeof value === 'object' && value !== null;
const baseIsArguments = (item: any): boolean => isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';
const isArguments = baseIsArguments(
	(function () { return arguments; })()
)
	? baseIsArguments
	: (value: any) => isObject(value) && typeof value.callee === 'function';