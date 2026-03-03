import { Base64 } from 'meteor/base64';

// --- Types ---

export type EJSONableCustomType = {
	clone?(): EJSONableCustomType;
	equals?(other: any): boolean;
	toJSONValue(): JSONable;
	typeName(): string;
};

export type EJSONableProperty =
	| number
	| string
	| boolean
	| Record<string, any>
	| number[]
	| string[]
	| Record<string, any>[]
	| Date
	| Uint8Array
	| EJSONableCustomType
	| undefined
	| null;

export type EJSONable = Record<string, EJSONableProperty>;

export type JSONable = Record<string,
	| number
	| string
	| boolean
	| Record<string, any>
	| number[]
	| string[]
	| Record<string, any>[]
	| undefined
	| null
>;

// --- Utilities ---

const isFunction = (fn: any): fn is Function => typeof fn === 'function';
const isObject = (fn: any): fn is object => typeof fn === 'object';
const keysOf = (obj: any): string[] => Object.keys(obj);
const lengthOf = (obj: any): number => Object.keys(obj).length;
const hasOwn = (obj: any, prop: string): boolean => Object.prototype.hasOwnProperty.call(obj, prop);
const isArguments = (obj: any): boolean => obj != null && hasOwn(obj, 'callee');
const isInfOrNaN = (obj: any): boolean => Number.isNaN(obj) || obj === Infinity || obj === -Infinity;

const handleError = (fn: Function) => function (this: any, ...args: any[]) {
	try {
		return fn.apply(this, args);
	} catch (error: any) {
		if (/Maximum call stack size exceeded/g.test(error?.message || '')) {
			throw new Error('Converting circular structure to JSON');
		}
		throw error;
	}
};

// --- Canonical Stringifier ---

function quote(str: string): string {
	return JSON.stringify(str);
}

const str = (key: string | number, holder: any, singleIndent: string, outerIndent: string, canonical?: boolean): string | undefined => {
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
				const length = value.length;
				for (let i = 0; i < length; i += 1) {
					partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';
				}

				if (partial.length === 0) {
					v = '[]';
				} else if (innerIndent) {
					v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';
				} else {
					v = '[' + partial.join(',') + ']';
				}
				return v;
			}

			let keys = Object.keys(value);
			if (canonical) {
				keys = keys.sort();
			}

			keys.forEach(k => {
				v = str(k, value, singleIndent, innerIndent, canonical);
				if (v) {
					partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
				}
			});

			if (partial.length === 0) {
				v = '{}';
			} else if (innerIndent) {
				v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';
			} else {
				v = '{' + partial.join(',') + '}';
			}
			return v;
		}
		default:
			return undefined;
	}
};

const canonicalStringify = (value: any, options: any): string => {
	const allOptions = Object.assign({
		indent: '',
		canonical: false,
	}, options);

	if (allOptions.indent === true) {
		allOptions.indent = '  ';
	} else if (typeof allOptions.indent === 'number') {
		let newIndent = '';
		for (let i = 0; i < allOptions.indent; i++) {
			newIndent += ' ';
		}
		allOptions.indent = newIndent;
	}

	return str('', { '': value }, allOptions.indent, '', allOptions.canonical) as string;
};

// --- EJSON Implementation ---

const customTypes = new Map<string, (val: any) => any>();

type Converter = {
	matchJSONValue: (obj: any) => boolean;
	matchObject: (obj: any) => boolean;
	toJSONValue: (obj: any) => any;
	fromJSONValue: (obj: any) => any;
};

const builtinConverters: Converter[] = [
	{ // Date
		matchJSONValue(obj) { return hasOwn(obj, '$date') && lengthOf(obj) === 1; },
		matchObject(obj) { return obj instanceof Date; },
		toJSONValue(obj: Date) { return { $date: obj.getTime() }; },
		fromJSONValue(obj) { return new Date(obj.$date); },
	},
	{ // RegExp
		matchJSONValue(obj) { return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && lengthOf(obj) === 2; },
		matchObject(obj) { return obj instanceof RegExp; },
		toJSONValue(regexp: RegExp) { return { $regexp: regexp.source, $flags: regexp.flags }; },
		fromJSONValue(obj) {
			return new RegExp(
				obj.$regexp,
				obj.$flags.slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, '')
			);
		},
	},
	{ // NaN, Inf, -Inf
		matchJSONValue(obj) { return hasOwn(obj, '$InfNaN') && lengthOf(obj) === 1; },
		matchObject: isInfOrNaN,
		toJSONValue(obj: number) {
			let sign: number;
			if (Number.isNaN(obj)) sign = 0;
			else if (obj === Infinity) sign = 1;
			else sign = -1;
			return { $InfNaN: sign };
		},
		fromJSONValue(obj) { return obj.$InfNaN / 0; },
	},
	{ // Binary
		matchJSONValue(obj) { return hasOwn(obj, '$binary') && lengthOf(obj) === 1; },
		matchObject(obj) { return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || (obj && hasOwn(obj, '$Uint8ArrayPolyfill')); },
		toJSONValue(obj: Uint8Array) { return { $binary: Base64.encode(obj) }; },
		fromJSONValue(obj) { return Base64.decode(obj.$binary); },
	},
	{ // Escaping one level
		matchJSONValue(obj) { return hasOwn(obj, '$escape') && lengthOf(obj) === 1; },
		matchObject(obj) {
			let match = false;
			if (obj) {
				const keyCount = lengthOf(obj);
				if (keyCount === 1 || keyCount === 2) {
					match = builtinConverters.some(converter => converter.matchJSONValue(obj));
				}
			}
			return match;
		},
		toJSONValue(obj: any) {
			const newObj: any = {};
			keysOf(obj).forEach(key => { newObj[key] = EJSON.toJSONValue(obj[key]); });
			return { $escape: newObj };
		},
		fromJSONValue(obj) {
			const newObj: any = {};
			keysOf(obj.$escape).forEach(key => { newObj[key] = EJSON.fromJSONValue(obj.$escape[key]); });
			return newObj;
		},
	},
	{ // Custom
		matchJSONValue(obj) { return hasOwn(obj, '$type') && hasOwn(obj, '$value') && lengthOf(obj) === 2; },
		matchObject(obj) { return EJSON._isCustomType(obj); },
		toJSONValue(obj: any) {
			const jsonValue = obj.toJSONValue();
			return { $type: obj.typeName(), $value: jsonValue };
		},
		fromJSONValue(obj) {
			const typeName = obj.$type;
			if (!customTypes.has(typeName)) {
				throw new Error(`Custom EJSON type ${typeName} is not defined`);
			}
			const converter = customTypes.get(typeName)!;
			return converter(obj.$value);
		},
	},
];

const toJSONValueHelper = (item: any): any => {
	for (let i = 0; i < builtinConverters.length; i++) {
		const converter = builtinConverters[i];
		if (converter.matchObject(item)) {
			return converter.toJSONValue(item);
		}
	}
	return undefined;
};

const adjustTypesToJSONValue = (obj: any): any => {
	if (obj === null) return null;

	const maybeChanged = toJSONValueHelper(obj);
	if (maybeChanged !== undefined) return maybeChanged;

	if (!isObject(obj)) return obj;

	keysOf(obj).forEach(key => {
		const value = (obj as any)[key];
		if (!isObject(value) && value !== undefined && !isInfOrNaN(value)) {
			return;
		}

		const changed = toJSONValueHelper(value);
		if (changed) {
			(obj as any)[key] = changed;
			return;
		}
		adjustTypesToJSONValue(value);
	});
	return obj;
};

const fromJSONValueHelper = (value: any): any => {
	if (isObject(value) && value !== null) {
		const keys = keysOf(value);
		if (keys.length <= 2 && keys.every(k => typeof k === 'string' && k.substr(0, 1) === '$')) {
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
	if (obj === null) return null;

	const maybeChanged = fromJSONValueHelper(obj);
	if (maybeChanged !== obj) return maybeChanged;

	if (!isObject(obj)) return obj;

	keysOf(obj).forEach(key => {
		const value = (obj as any)[key];
		if (isObject(value)) {
			const changed = fromJSONValueHelper(value);
			if (value !== changed) {
				(obj as any)[key] = changed;
				return;
			}
			adjustTypesFromJSONValue(value);
		}
	});
	return obj;
};

export const EJSON = {
	addType(name: string, factory: (val: any) => any): void {
		if (customTypes.has(name)) {
			throw new Error(`Type ${name} already present`);
		}
		customTypes.set(name, factory);
	},

	_isCustomType(obj: any): boolean {
		return (
			obj &&
			isFunction(obj.toJSONValue) &&
			isFunction(obj.typeName) &&
			customTypes.has(obj.typeName())
		);
	},

	toJSONValue(item: any): any {
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
	},

	fromJSONValue(item: any): any {
		let changed = fromJSONValueHelper(item);
		if (changed === item && isObject(item)) {
			changed = EJSON.clone(item);
			adjustTypesFromJSONValue(changed);
		}
		return changed;
	},

	stringify: handleError((item: any, options?: { indent?: boolean | number | string, canonical?: boolean }): string => {
		let serialized: string;
		const json = EJSON.toJSONValue(item);
		if (options && (options.canonical || options.indent)) {
			serialized = canonicalStringify(json, options);
		} else {
			serialized = JSON.stringify(json);
		}
		return serialized;
	}),

	parse(item: string): any {
		if (typeof item !== 'string') {
			throw new Error('EJSON.parse argument should be a string');
		}
		return EJSON.fromJSONValue(JSON.parse(item));
	},

	isBinary(obj: any): obj is Uint8Array {
		return !!((typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) ||
			(obj && obj.$Uint8ArrayPolyfill));
	},

	equals(a: any, b: any, options?: { keyOrderSensitive?: boolean }): boolean {
		let i: number;
		const keyOrderSensitive = !!(options && options.keyOrderSensitive);

		if (a === b) return true;
		if (Number.isNaN(a) && Number.isNaN(b)) return true;
		if (!a || !b) return false;
		if (!(isObject(a) && isObject(b))) return false;
		if (a instanceof Date && b instanceof Date) return a.valueOf() === b.valueOf();

		if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
			if (a.length !== b.length) return false;
			for (i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) return false;
			}
			return true;
		}

		if (isFunction((a as any).equals)) return (a as any).equals(b, options);
		if (isFunction((b as any).equals)) return (b as any).equals(a, options);

		const aIsArray = Array.isArray(a);
		const bIsArray = Array.isArray(b);

		if (aIsArray !== bIsArray) return false;

		if (aIsArray && bIsArray) {
			if (a.length !== b.length) return false;
			for (i = 0; i < a.length; i++) {
				if (!EJSON.equals(a[i], b[i], options)) return false;
			}
			return true;
		}

		switch (Number(EJSON._isCustomType(a)) + Number(EJSON._isCustomType(b))) {
			case 1: return false;
			case 2: return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));
			default: break;
		}

		let ret: boolean;
		const aKeys = keysOf(a);
		const bKeys = keysOf(b);

		if (keyOrderSensitive) {
			i = 0;
			ret = aKeys.every(key => {
				if (i >= bKeys.length) return false;
				if (key !== bKeys[i]) return false;
				if (!EJSON.equals((a as any)[key], (b as any)[bKeys[i]], options)) return false;
				i++;
				return true;
			});
		} else {
			i = 0;
			ret = aKeys.every(key => {
				if (!hasOwn(b, key)) return false;
				if (!EJSON.equals((a as any)[key], (b as any)[key], options)) return false;
				i++;
				return true;
			});
		}
		return ret && i === bKeys.length;
	},

	clone<T>(v: T): T {
		let ret: any;
		if (!isObject(v)) return v;
		if (v === null) return null as any;
		if (v instanceof Date) return new Date(v.getTime()) as any;
		if (v instanceof RegExp) return v as any;

		if (EJSON.isBinary(v)) {
			ret = EJSON.newBinary((v as any).length);
			for (let i = 0; i < (v as any).length; i++) {
				ret[i] = (v as any)[i];
			}
			return ret;
		}

		if (Array.isArray(v)) {
			return v.map(EJSON.clone) as any;
		}

		if (isArguments(v)) {
			return Array.from(v as any).map(EJSON.clone) as any;
		}

		if (isFunction((v as any).clone)) {
			return (v as any).clone();
		}

		if (EJSON._isCustomType(v)) {
			return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)));
		}

		ret = {};
		keysOf(v).forEach((key) => {
			ret[key] = EJSON.clone((v as any)[key]);
		});
		return ret;
	},

	newBinary: Base64.newBinary,
	_adjustTypesFromJSONValue: adjustTypesFromJSONValue,
	_adjustTypesToJSONValue: adjustTypesToJSONValue,
};