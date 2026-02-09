import { Base64 } from './base64.ts';
import { Meteor } from './meteor.ts';
import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

// Types
type EJSONOptions = {
	canonical?: boolean;
	indent?: boolean | number | string;
	keyOrderSensitive?: boolean;
};

interface IEJSONConverter {
	matchJSONValue(obj: any): boolean;
	matchObject(obj: any): boolean;
	toJSONValue(obj: any): any;
	fromJSONValue(obj: any): any;
}

type JSONable = {
	[key: string]: number | string | boolean | object | number[] | string[] | object[] | undefined | null;
};

export type EJSONableCustomType = {
	clone?(): EJSONableCustomType;
	equals?(other: object): boolean;
	toJSONValue(): JSONable;
	typeName(): string;
};

export type EJSONableProperty =
	| number
	| string
	| boolean
	| object
	| number[]
	| string[]
	| object[]
	| Date
	| Uint8Array
	| EJSONableCustomType
	| undefined
	| null;

export type EJSONable = {
	[key: string]: EJSONableProperty;
};

const customTypes = new Map<string, (jsonValue: any) => any>();

const isFunction = (fn: unknown): fn is (...args: unknown[]) => unknown => typeof fn === 'function';
const isObject = (fn: any): fn is Record<string, any> => typeof fn === 'object' && fn !== null;

const keysOf = (obj: any) => Object.keys(obj);
const lengthOf = (obj: any) => Object.keys(obj).length;

const convertMapToObject = (map: Map<any, any>) =>
	Array.from(map).reduce(
		(acc, [key, value]) => {
			acc[key] = value;
			return acc;
		},
		{} as Record<string, any>,
	);

const isArguments = (obj: any) => obj != null && hasOwn(obj, 'callee');
const isInfOrNaN = (obj: any) => Number.isNaN(obj) || obj === Infinity || obj === -Infinity;

const checkError = {
	maxStack: (msgError: string) => new RegExp('Maximum call stack size exceeded', 'g').test(msgError),
};

const handleError = <T extends (...args: any[]) => any>(fn: T) =>
	function (this: any, ...args: Parameters<T>): ReturnType<T> {
		try {
			return fn.apply(this, args);
		} catch (error: any) {
			const isMaxStack = checkError.maxStack(error.message);

			if (isMaxStack) {
				throw new Error('Converting circular structure to JSON');
			}

			throw error;
		}
	};

function quote(string: string) {
	return JSON.stringify(string);
}

const str = (key: string, holder: any, singleIndent: string | false, outerIndent: string, canonical: boolean): string => {
	const value = holder[key];

	switch (typeof value) {
		case 'string':
			return quote(value);

		case 'number':
			return isFinite(value) ? String(value) : 'null';

		case 'boolean':
			return String(value);

		case 'object': {
			if (!value) {
				return 'null';
			}

			const innerIndent = outerIndent + singleIndent;
			const partial: string[] = [];
			let v: string | undefined;

			if (Array.isArray(value) || hasOwn(value, 'callee')) {
				const { length } = value;

				for (let i = 0; i < length; i += 1) {
					partial[i] = str(String(i), value, singleIndent, innerIndent, canonical) || 'null';
				}

				if (partial.length === 0) {
					v = '[]';
				} else if (innerIndent) {
					v = `[\n${innerIndent}${partial.join(`,\n${innerIndent}`)}\n${outerIndent}]`;
				} else {
					v = `[${partial.join(',')}]`;
				}

				return v;
			}

			let keys = Object.keys(value);

			if (canonical) {
				keys = keys.sort();
			}

			keys.forEach((k) => {
				v = str(k, value, singleIndent, innerIndent, canonical);

				if (v) {
					partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
				}
			});

			if (partial.length === 0) {
				v = '{}';
			} else if (innerIndent) {
				v = `{\n${innerIndent}${partial.join(`,\n${innerIndent}`)}\n${outerIndent}}`;
			} else {
				v = `{${partial.join(',')}}`;
			}

			return v;
		}
		default:
			return 'null';
	}
};

const canonicalStringify = (value: any, options: EJSONOptions): string => {
	const allOptions = { indent: '', canonical: false, ...options };

	if (allOptions.indent === true) {
		allOptions.indent = '  ';
	} else if (typeof allOptions.indent === 'number') {
		let newIndent = '';
		for (let i = 0; i < allOptions.indent; i++) {
			newIndent += ' ';
		}
		allOptions.indent = newIndent;
	}

	return str('', { '': value }, allOptions.indent, '', allOptions.canonical);
};

// Forward declarations
function toJSONValue(item: any): any {
	const changed = toJSONValueHelper(item);

	if (changed !== undefined) {
		return changed;
	}

	let newItem = item;

	if (isObject(item)) {
		newItem = EJSON.clone(item);
		adjustTypesToJSONValue(newItem);
	}

	return newItem;
}

function fromJSONValue(item: any): any {
	let changed = fromJSONValueHelper(item);

	if (changed === item && isObject(item)) {
		changed = EJSON.clone(item);
		adjustTypesFromJSONValue(changed);
	}

	return changed;
}

function _isCustomType(obj: any): boolean {
	return obj && isFunction(obj.toJSONValue) && isFunction(obj.typeName) && customTypes.has(obj.typeName());
}

const builtinConverters: IEJSONConverter[] = [
	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$date') && lengthOf(obj) === 1;
		},

		matchObject(obj) {
			return obj instanceof Date;
		},

		toJSONValue(obj) {
			return { $date: obj.getTime() };
		},

		fromJSONValue(obj) {
			return new Date(obj.$date);
		},
	},

	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && lengthOf(obj) === 2;
		},

		matchObject(obj) {
			return obj instanceof RegExp;
		},

		toJSONValue(regexp) {
			return { $regexp: regexp.source, $flags: regexp.flags };
		},

		fromJSONValue(obj) {
			return new RegExp(
				obj.$regexp,
				obj.$flags
					.slice(0, 50)
					.replace(/[^gimuy]/g, '')
					.replace(/(.)(?=.*\1)/g, ''),
			);
		},
	},

	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$InfNaN') && lengthOf(obj) === 1;
		},
		matchObject: isInfOrNaN,
		toJSONValue(obj) {
			let sign;

			if (Number.isNaN(obj)) {
				sign = 0;
			} else if (obj === Infinity) {
				sign = 1;
			} else {
				sign = -1;
			}

			return { $InfNaN: sign };
		},

		fromJSONValue(obj) {
			return obj.$InfNaN / 0;
		},
	},

	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$binary') && lengthOf(obj) === 1;
		},

		matchObject(obj) {
			return (typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) || (obj && hasOwn(obj, '$Uint8ArrayPolyfill'));
		},

		toJSONValue(obj) {
			return { $binary: (Base64 as any).encode(obj) };
		},

		fromJSONValue(obj) {
			return (Base64 as any).decode(obj.$binary);
		},
	},

	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$escape') && lengthOf(obj) === 1;
		},

		matchObject(obj) {
			let match = false;

			if (obj) {
				const keyCount = lengthOf(obj);

				if (keyCount === 1 || keyCount === 2) {
					match = builtinConverters.some((converter) => converter.matchJSONValue(obj));
				}
			}

			return match;
		},

		toJSONValue(obj) {
			const newObj: Record<string, any> = {};

			keysOf(obj).forEach((key) => {
				newObj[key] = toJSONValue(obj[key]);
			});

			return { $escape: newObj };
		},

		fromJSONValue(obj) {
			const newObj: Record<string, any> = {};

			keysOf(obj.$escape).forEach((key) => {
				newObj[key] = fromJSONValue(obj.$escape[key]);
			});

			return newObj;
		},
	},

	{
		matchJSONValue(obj) {
			return hasOwn(obj, '$type') && hasOwn(obj, '$value') && lengthOf(obj) === 2;
		},

		matchObject(obj) {
			return _isCustomType(obj);
		},

		toJSONValue(obj) {
			const jsonValue = Meteor._noYieldsAllowed(() => obj.toJSONValue());

			return { $type: obj.typeName(), $value: jsonValue };
		},

		fromJSONValue(obj) {
			const typeName = obj.$type;

			if (!customTypes.has(typeName)) {
				throw new Error(`Custom EJSON type ${typeName} is not defined`);
			}

			const converter = customTypes.get(typeName);

			return Meteor._noYieldsAllowed(() => (converter as (v: any) => any)(obj.$value));
		},
	},
];

const _getTypes = (isOriginal = false) => {
	return isOriginal ? customTypes : convertMapToObject(customTypes);
};

const _getConverters = () => builtinConverters;

const toJSONValueHelper = (item: any) => {
	for (let i = 0; i < builtinConverters.length; i++) {
		const converter = builtinConverters[i];

		if (converter.matchObject(item)) {
			return converter.toJSONValue(item);
		}
	}

	return undefined;
};

const adjustTypesToJSONValue = (obj: any): any => {
	if (obj === null) {
		return null;
	}

	const maybeChanged = toJSONValueHelper(obj);

	if (maybeChanged !== undefined) {
		return maybeChanged;
	}

	if (!isObject(obj)) {
		return obj;
	}

	keysOf(obj).forEach((key) => {
		const value = obj[key];

		if (!isObject(value) && value !== undefined && !isInfOrNaN(value)) {
			return;
		}

		const changed = toJSONValueHelper(value);

		if (changed) {
			obj[key] = changed;

			return;
		}

		adjustTypesToJSONValue(value);
	});

	return obj;
};

const fromJSONValueHelper = (value: any) => {
	if (isObject(value) && value !== null) {
		const keys = keysOf(value);

		if (keys.length <= 2 && keys.every((k) => typeof k === 'string' && k.substr(0, 1) === '$')) {
			for (let i = 0; i < builtinConverters.length; i++) {
				const converter = builtinConverters[i];

				if (converter.matchJSONValue(value)) {
					return converter.fromJSONValue(value);
				}
			}
		}
	}

	return value;
};

const adjustTypesFromJSONValue = (obj: any): any => {
	if (obj === null) {
		return null;
	}

	const maybeChanged = fromJSONValueHelper(obj);

	if (maybeChanged !== obj) {
		return maybeChanged;
	}

	if (!isObject(obj)) {
		return obj;
	}

	keysOf(obj).forEach((key) => {
		const value = obj[key];

		if (isObject(value)) {
			const changed = fromJSONValueHelper(value);

			if (value !== changed) {
				obj[key] = changed;

				return;
			}

			adjustTypesFromJSONValue(value);
		}
	});

	return obj;
};

const stringify = handleError((item: any, options?: EJSONOptions): string => {
	let serialized: string;
	const json = toJSONValue(item);

	if (options && (options.canonical || options.indent)) {
		serialized = canonicalStringify(json, options);
	} else {
		serialized = JSON.stringify(json);
	}

	return serialized;
});

const parse = (item: string) => {
	if (typeof item !== 'string') {
		throw new Error('EJSON.parse argument should be a string');
	}

	return fromJSONValue(JSON.parse(item));
};

const isBinary = (obj: any): boolean => {
	return !!((typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) || obj?.$Uint8ArrayPolyfill);
};

const equals = (a: any, b: any, options?: { keyOrderSensitive?: boolean }): boolean => {
	let i: number;
	const keyOrderSensitive = !!options?.keyOrderSensitive;

	if (a === b) {
		return true;
	}

	if (Number.isNaN(a) && Number.isNaN(b)) {
		return true;
	}

	if (!a || !b) {
		return false;
	}

	if (!isObject(a) || !isObject(b)) {
		return false;
	}

	if (a instanceof Date && b instanceof Date) {
		return a.valueOf() === b.valueOf();
	}

	if (isBinary(a) && isBinary(b)) {
		if ((a as any).length !== (b as any).length) {
			return false;
		}

		for (i = 0; i < (a as any).length; i++) {
			if ((a as any)[i] !== (b as any)[i]) {
				return false;
			}
		}

		return true;
	}

	if (isFunction((a as any).equals)) {
		return (a as any).equals(b, options);
	}

	if (isFunction((b as any).equals)) {
		return (b as any).equals(a, options);
	}

	const aIsArray = Array.isArray(a);
	const bIsArray = Array.isArray(b);

	if (aIsArray !== bIsArray) {
		return false;
	}

	if (aIsArray && bIsArray) {
		if (a.length !== b.length) {
			return false;
		}

		for (i = 0; i < a.length; i++) {
			if (!equals(a[i], b[i], options)) {
				return false;
			}
		}

		return true;
	}

	if (_isCustomType(a) || _isCustomType(b)) {
		if (!_isCustomType(a) || !_isCustomType(b)) {
			return false;
		}
		return equals(toJSONValue(a), toJSONValue(b));
	}

	let ret;
	const aKeys = keysOf(a);
	const bKeys = keysOf(b);

	if (keyOrderSensitive) {
		i = 0;

		ret = aKeys.every((key) => {
			if (i >= bKeys.length) {
				return false;
			}

			if (key !== bKeys[i]) {
				return false;
			}

			if (!equals((a as any)[key], (b as any)[bKeys[i]], options)) {
				return false;
			}

			i++;

			return true;
		});
	} else {
		i = 0;

		ret = aKeys.every((key) => {
			if (!hasOwn(b, key)) {
				return false;
			}

			if (!equals((a as any)[key], (b as any)[key], options)) {
				return false;
			}

			i++;

			return true;
		});
	}

	return ret && i === bKeys.length;
};

const clone = (v: any): any => {
	let ret: any;

	if (!isObject(v)) {
		return v;
	}

	if (v === null) {
		return null;
	}

	if (v instanceof Date) {
		return new Date(v.getTime());
	}

	if (v instanceof RegExp) {
		return v;
	}

	if (isBinary(v)) {
		ret = (Base64 as any).newBinary((v as any).length);

		for (let i = 0; i < (v as any).length; i++) {
			ret[i] = (v as any)[i];
		}

		return ret;
	}

	if (Array.isArray(v)) {
		return v.map(clone);
	}

	if (isArguments(v)) {
		return Array.from(v as any).map(clone);
	}

	if (isFunction(v.clone)) {
		return v.clone();
	}

	if (_isCustomType(v)) {
		return fromJSONValue(clone(toJSONValue(v)));
	}

	ret = {};

	keysOf(v).forEach((key) => {
		ret[key] = clone(v[key]);
	});

	return ret;
};

const EJSON = {
	addType: (name: string, factory: (jsonValue: any) => any) => {
		if (customTypes.has(name)) {
			throw new Error(`Type ${name} already present`);
		}

		customTypes.set(name, factory);
	},
	_getTypes,
	_getConverters,
	_isCustomType,
	_adjustTypesToJSONValue: adjustTypesToJSONValue,
	_adjustTypesFromJSONValue: adjustTypesFromJSONValue,
	toJSONValue,
	fromJSONValue,
	stringify,
	parse,
	isBinary,
	equals,
	clone,
	newBinary: Base64.newBinary,
};

export { EJSON };

Package.ejson = { EJSON };
