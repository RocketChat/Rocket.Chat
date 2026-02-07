import '/src/meteor/base64.ts';
import '/src/meteor/modules.ts';

const isFunction = (fn) => typeof fn === 'function';
const isObject = (fn) => typeof fn === 'object';
const keysOf = (obj) => Object.keys(obj);
const lengthOf = (obj) => Object.keys(obj).length;
const hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

const convertMapToObject = (map) =>
	Array.from(map).reduce((acc, _ref) => {
		let [key, value] = _ref;

		acc[key] = value;

		return acc;
	}, {});

const isArguments = (obj) => obj != null && hasOwn(obj, 'callee');
const isInfOrNaN = (obj) => Number.isNaN(obj) || obj === Infinity || obj === -Infinity;

const checkError = {
	maxStack: (msgError) => new RegExp('Maximum call stack size exceeded', 'g').test(msgError),
};

const handleError = (fn) =>
	function () {
		try {
			return fn.apply(this, arguments);
		} catch (error) {
			const isMaxStack = checkError.maxStack(error.message);

			if (isMaxStack) {
				throw new Error('Converting circular structure to JSON');
			}

			throw error;
		}
	};

Package['core-runtime'].queue('ejson', function () {
	var Meteor = Package.meteor.Meteor;
	var Base64 = Package.base64.Base64;
	var meteorInstall = Package.modules.meteorInstall;
	var EJSON;

	var require = meteorInstall(
		{
			node_modules: {
				meteor: {
					ejson: {
						'ejson.js'(require, exports, module) {
							module.export({ EJSON: () => EJSON });

							let canonicalStringify;

							module.link(
								'./stringify',
								{
									default(v) {
										canonicalStringify = v;
									},
								},
								1,
							);

							const EJSON = {};
							const customTypes = new Map();

							EJSON.addType = (name, factory) => {
								if (customTypes.has(name)) {
									throw new Error('Type '.concat(name, ' already present'));
								}

								customTypes.set(name, factory);
							};

							const builtinConverters = [
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
										return { $binary: Base64.encode(obj) };
									},

									fromJSONValue(obj) {
										return Base64.decode(obj.$binary);
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
										const newObj = {};

										keysOf(obj).forEach((key) => {
											newObj[key] = EJSON.toJSONValue(obj[key]);
										});

										return { $escape: newObj };
									},

									fromJSONValue(obj) {
										const newObj = {};

										keysOf(obj.$escape).forEach((key) => {
											newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);
										});

										return newObj;
									},
								},

								{
									matchJSONValue(obj) {
										return hasOwn(obj, '$type') && hasOwn(obj, '$value') && lengthOf(obj) === 2;
									},

									matchObject(obj) {
										return EJSON._isCustomType(obj);
									},

									toJSONValue(obj) {
										const jsonValue = Meteor._noYieldsAllowed(() => obj.toJSONValue());

										return { $type: obj.typeName(), $value: jsonValue };
									},

									fromJSONValue(obj) {
										const typeName = obj.$type;

										if (!customTypes.has(typeName)) {
											throw new Error('Custom EJSON type '.concat(typeName, ' is not defined'));
										}

										const converter = customTypes.get(typeName);

										return Meteor._noYieldsAllowed(() => converter(obj.$value));
									},
								},
							];

							EJSON._isCustomType = (obj) =>
								obj && isFunction(obj.toJSONValue) && isFunction(obj.typeName) && customTypes.has(obj.typeName());

							EJSON._getTypes = function () {
								let isOriginal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

								return isOriginal ? customTypes : convertMapToObject(customTypes);
							};

							EJSON._getConverters = () => builtinConverters;

							const toJSONValueHelper = (item) => {
								for (let i = 0; i < builtinConverters.length; i++) {
									const converter = builtinConverters[i];

									if (converter.matchObject(item)) {
										return converter.toJSONValue(item);
									}
								}

								return undefined;
							};

							const adjustTypesToJSONValue = (obj) => {
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

							EJSON._adjustTypesToJSONValue = adjustTypesToJSONValue;

							EJSON.toJSONValue = (item) => {
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
							};

							const fromJSONValueHelper = (value) => {
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

							const adjustTypesFromJSONValue = (obj) => {
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

							EJSON._adjustTypesFromJSONValue = adjustTypesFromJSONValue;

							EJSON.fromJSONValue = (item) => {
								let changed = fromJSONValueHelper(item);

								if (changed === item && isObject(item)) {
									changed = EJSON.clone(item);
									adjustTypesFromJSONValue(changed);
								}

								return changed;
							};

							EJSON.stringify = handleError((item, options) => {
								let serialized;
								const json = EJSON.toJSONValue(item);

								if (options && (options.canonical || options.indent)) {
									serialized = canonicalStringify(json, options);
								} else {
									serialized = JSON.stringify(json);
								}

								return serialized;
							});

							EJSON.parse = (item) => {
								if (typeof item !== 'string') {
									throw new Error('EJSON.parse argument should be a string');
								}

								return EJSON.fromJSONValue(JSON.parse(item));
							};

							EJSON.isBinary = (obj) => {
								return !!((typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) || (obj && obj.$Uint8ArrayPolyfill));
							};

							EJSON.equals = (a, b, options) => {
								let i;
								const keyOrderSensitive = !!(options && options.keyOrderSensitive);

								if (a === b) {
									return true;
								}

								if (Number.isNaN(a) && Number.isNaN(b)) {
									return true;
								}

								if (!a || !b) {
									return false;
								}

								if (!(isObject(a) && isObject(b))) {
									return false;
								}

								if (a instanceof Date && b instanceof Date) {
									return a.valueOf() === b.valueOf();
								}

								if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
									if (a.length !== b.length) {
										return false;
									}

									for (i = 0; i < a.length; i++) {
										if (a[i] !== b[i]) {
											return false;
										}
									}

									return true;
								}

								if (isFunction(a.equals)) {
									return a.equals(b, options);
								}

								if (isFunction(b.equals)) {
									return b.equals(a, options);
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
										if (!EJSON.equals(a[i], b[i], options)) {
											return false;
										}
									}

									return true;
								}

								switch (EJSON._isCustomType(a) + EJSON._isCustomType(b)) {
									case 1:
										return false;

									case 2:
										return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));

									default:
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

										if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
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

										if (!EJSON.equals(a[key], b[key], options)) {
											return false;
										}

										i++;

										return true;
									});
								}

								return ret && i === bKeys.length;
							};

							EJSON.clone = (v) => {
								let ret;

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

								if (EJSON.isBinary(v)) {
									ret = EJSON.newBinary(v.length);

									for (let i = 0; i < v.length; i++) {
										ret[i] = v[i];
									}

									return ret;
								}

								if (Array.isArray(v)) {
									return v.map(EJSON.clone);
								}

								if (isArguments(v)) {
									return Array.from(v).map(EJSON.clone);
								}

								if (isFunction(v.clone)) {
									return v.clone();
								}

								if (EJSON._isCustomType(v)) {
									return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);
								}

								ret = {};

								keysOf(v).forEach((key) => {
									ret[key] = EJSON.clone(v[key]);
								});

								return ret;
							};

							EJSON.newBinary = Base64.newBinary;
						},

						'stringify.js'(require, exports, module) {
							function quote(string) {
								return JSON.stringify(string);
							}

							const str = (key, holder, singleIndent, outerIndent, canonical) => {
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
										const partial = [];
										let v;

										if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {
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

										keys.forEach((k) => {
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
								}
							};

							const canonicalStringify = (value, options) => {
								const allOptions = Object.assign({ indent: '', canonical: false }, options);

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

							module.exportDefault(canonicalStringify);
						},
					},
				},
			},
		},
		{ extensions: ['.js', '.json'] },
	);

	return {
		export() {
			return { EJSON };
		},
		require,
		eagerModulePaths: ['/node_modules/meteor/ejson/ejson.js'],
		mainModulePath: '/node_modules/meteor/ejson/ejson.js',
	};
});
export const { EJSON } = Package['ejson'];
