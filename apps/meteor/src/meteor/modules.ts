/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nochecka

import { Meteor } from 'meteor/meteor';

import { queue } from './core-runtime.ts';
import { meteorInstall, Module, type Leaf } from './modules-runtime.ts';
import { Package } from './package-registry.ts';

// hasOwn
const hasOwn = <T extends object>(object: T, property: PropertyKey): property is keyof T => {
	return Object.hasOwn(object, property);
};

// css.js

function addStyles(css: string) {
	const style = document.createElement('style');

	style.setAttribute('type', 'text/css');

	style.appendChild(document.createTextNode(css));
	const head = document.getElementsByTagName('head').item(0);

	return head?.appendChild(style);
}

function install(name: string, mainModule?: string) {
	const meteorDir: Record<`${string}.js`, Leaf | string> = {};

	if (typeof mainModule === 'string') {
		meteorDir[`${name}.js`] = mainModule;
	} else {
		meteorDir[`${name}.js`] = function (_r, _e, module) {
			module.exports = Package[name];
		};
	}

	meteorInstall({ node_modules: { meteor: meteorDir } });
}

install('meteor');
install('ejson', 'meteor/ejson/ejson.js');
install('diff-sequence', 'meteor/diff-sequence/diff.js');
install('random', 'meteor/random/main_client.js');
install('mongo-id', 'meteor/mongo-id/id.js');
install('tracker');
install('ddp-common');
install('socket-stream-client', 'meteor/socket-stream-client/browser.js');
install('logging', 'meteor/logging/logging.js');

const esStrKey = '__esModule';
const esSymKey = Symbol.for(esStrKey);
function isObjectLike(value: unknown): value is object | Function {
	const type = typeof value;
	return type === 'function' || (type === 'object' && value !== null);
}

function getESModule(exported: object) {
	if (isObjectLike(exported)) {
		if (hasOwn(exported, esSymKey)) {
			return !!exported[esSymKey];
		}

		if (hasOwn(exported, esStrKey)) {
			return !!exported[esStrKey];
		}
	}

	return false;
}

function createNamespace() {
	const namespace = Object.create(null);

	Object.defineProperty(namespace, Symbol.toStringTag, {
		value: 'Module',
		configurable: false,
		enumerable: false,
		writable: false,
	});

	return namespace;
}

function copyKey(key: PropertyKey, target: any, source: any) {
	const desc = Object.getOwnPropertyDescriptor(source, key);
	Object.defineProperty(target, key, { ...desc, configurable: true });
}

function isObject(value: unknown): value is object {
	return typeof value === 'object' && value !== null;
}

function ensureObjectProperty(object: Record<PropertyKey, any>, propertyName: PropertyKey) {
	if (!hasOwn(object, propertyName)) {
		object[propertyName] = Object.create(null);
	}

	return object[propertyName];
}

function safeKeys(obj: {}) {
	const keys = Object.keys(obj);
	const esModuleIndex = keys.indexOf('__esModule');

	if (esModuleIndex >= 0) {
		keys.splice(esModuleIndex, 1);
	}

	return keys;
}

const GETTER_ERROR = {};
const NAN = {};
const UNDEFINED = {};
let keySalt = 0;
let nextEvaluationIndex = 0;

class Entry extends Module {
	module: any;

	namespace: any;

	getters: any;

	setters: any;

	newSetters: any;

	snapshots: any;

	hasTLA: boolean;

	asyncEvaluation: boolean;

	asyncEvaluationIndex: any;

	pendingAsyncDeps: number;

	_onEvaluating: any[];

	_onEvaluated: any[];

	status: string;

	allAsyncParents: any[];

	pendingAsyncParents: any[];

	evaluationError: any;

	constructor(id: any) {
		super(id);
		this.id = id;
		this.module = null;
		this.namespace = createNamespace();
		this.getters = Object.create(null);
		this.setters = Object.create(null);
		this.newSetters = Object.create(null);
		this.snapshots = Object.create(null);
		this.hasTLA = false;
		this.asyncEvaluation = false;
		this.asyncEvaluationIndex = null;
		this.pendingAsyncDeps = 0;
		this._onEvaluating = [];
		this._onEvaluated = [];
		this.status = 'linking';
		this.allAsyncParents = [];
		this.pendingAsyncParents = [];
		this.evaluationError = null;
	}

	static getOrCreate(id: PropertyKey, mod: Module | null = null) {
		const entry = hasOwn(entryMap, id) ? entryMap[id] : (entryMap[id] = new Entry(id));

		if (isObject(mod) && mod.id === entry.id) {
			entry.module = mod;
		}

		return entry;
	}

	static getOrNull(id: PropertyKey) {
		if (hasOwn(entryMap, id)) {
			return entryMap[id];
		}

		return null;
	}

	addGetters(getters: { [x: string]: any }, constant: boolean) {
		const names = safeKeys(getters);
		const nameCount = names.length;

		constant = !!constant;

		for (let i = 0; i < nameCount; ++i) {
			const name = names[i];
			const getter = getters[name];

			if (typeof getter === 'function' && !(name in this.getters)) {
				this.getters[name] = getter;
				getter.constant = constant;
				getter.runCount = 0;
			}
		}
	}

	addSetters(parent: { id: any; exportAs: (arg0: string) => any }, setters: { [x: string]: any }, key: string | undefined) {
		const names = safeKeys(setters);
		const nameCount = names.length;

		if (!nameCount) {
			return;
		}

		key = key === void 0 ? makeUniqueKey() : `${parent.id}:${key}`;

		// const entry = this;

		for (let i = 0; i < nameCount; ++i) {
			const name = names[i];
			const setter = normalizeSetterValue(parent, setters[name]);

			if (typeof setter === 'function') {
				setter.parent = parent;
				ensureObjectProperty(this.setters, name)[key] = setter;
				ensureObjectProperty(this.newSetters, name)[key] = setter;
			}
		}

		this.runSetters(names);
	}

	runGetters(names: string[] | undefined) {
		syncExportsToNamespace(this, names);

		if (names === void 0 || names.indexOf('*') >= 0) {
			names = Object.keys(this.getters);
		}

		const nameCount = names.length;

		for (let i = 0; i < nameCount; ++i) {
			const name = names[i];
			const value = runGetter(this, name);

			if (value !== GETTER_ERROR) {
				this.namespace[name] = value;
				this.module.exports[name] = value;
			}
		}
	}

	override runSetters(names: string[] | undefined, runNsSetter?: any) {
		this.runGetters(names);

		if (runNsSetter && names !== void 0) {
			names.push('*');
		}

		let parents: { [x: string]: any } = {};
		let parentNames: { [x: string]: any } = {};

		forEachSetter(
			this,
			names,
			(setter: { (arg0: any, arg1: any): void; (arg0: any, arg1: any): void; parent: any; exportAs: any }, name: any, value: any) => {
				if (parents === void 0) {
					parents = Object.create(null);
				}

				if (parentNames === void 0) {
					parentNames = Object.create(null);
				}

				const parentId = setter.parent.id;

				if (setter.exportAs !== void 0 && parentNames[parentId] !== false) {
					parentNames[parentId] = parentNames[parentId] || [];
					parentNames[parentId].push(setter.exportAs);
				} else if (parentNames[parentId] !== false) {
					parentNames[parentId] = false;
				}

				parents[parentId] = setter.parent;
				setter(value, name);
			},
		);

		if (!parents) {
			return;
		}

		const parentIDs = Object.keys(parents);
		const parentIDCount = parentIDs.length;

		for (let i = 0; i < parentIDCount; ++i) {
			const parent = parents[parentIDs[i]];
			const parentEntry = entryMap[parent.id];

			if (parentEntry) {
				parentEntry.runSetters(parentNames[parentIDs[i]] || void 0, !!parentNames[parentIDs[i]]);
			}
		}
	}
}

const Ep = Object.setPrototypeOf(Entry.prototype, null);
const entryMap = Object.create(null);

function normalizeSetterValue(module: { exportAs: (arg0: string) => any }, setter: any[]) {
	if (typeof setter === 'function') {
		return setter;
	}

	if (typeof setter === 'string') {
		return module.exportAs(setter);
	}

	if (Array.isArray(setter)) {
		switch (setter.length) {
			case 0:
				return null;

			case 1:
				return normalizeSetterValue(module, setter[0]);

			default:
				const setterFns = setter.map((elem) => {
					return normalizeSetterValue(module, elem);
				});
				return function (value: any) {
					setterFns.forEach((fn) => {
						fn(value);
					});
				};
		}
	}

	return null;
}

function syncExportsToNamespace(
	entry: { module: { exports: any } | null; namespace: { default: any }; getters: object },
	names: string[] | undefined,
) {
	let setDefault = false;

	if (entry.module === null) return;

	const { exports } = entry.module;

	if (!getESModule(exports)) {
		entry.namespace.default = exports;
		setDefault = true;
	}

	if (!isObjectLike(exports)) {
		return;
	}

	if (names === void 0 || names.indexOf('*') >= 0) {
		names = Object.keys(exports);
	}

	names.forEach((key: PropertyKey) => {
		if (!hasOwn(entry.getters, key) && !(setDefault && key === 'default') && hasOwn(exports, key)) {
			copyKey(key, entry.namespace, exports);
		}
	});
}

Ep.addAsyncDep = function (childEntry: { status: string; allAsyncParents: any[]; pendingAsyncParents: any[]; evaluationError: any }) {
	if (childEntry.status !== 'evaluated') {
		this.pendingAsyncDeps += 1;
		childEntry.allAsyncParents.push(this);
		childEntry.pendingAsyncParents.push(this);
	}

	if (childEntry.evaluationError) {
		this.setEvaluationError(childEntry.evaluationError);
	}
};

Ep.changeStatus = function (status: any) {
	switch (status) {
		case 'linking':
			this.status = 'linking';
			break;

		case 'evaluating':
			this.status = 'evaluating';
			this._onEvaluating.forEach((callback: () => void) => {
				callback();
			});
			break;

		case 'evaluated':
			this.status = 'evaluated';
			const toEvaluate: any[] = [];
			this.gatherReadyAsyncParents(toEvaluate);
			toEvaluate.sort((entryA, entryB) => {
				return entryA.asyncEvaluationIndex - entryB.asyncEvaluationIndex;
			});
			toEvaluate.forEach((parent) => {
				parent.changeStatus('evaluating');
			});
			const callbacks = this._onEvaluated;
			this._onEvaluated = [];
			callbacks.forEach((callback: () => void) => {
				callback();
			});
			break;

		default:
			throw new Error(`Unrecognized module status: ${status}`);
	}
};

Ep.gatherReadyAsyncParents = function (readyList: any[]) {
	this.pendingAsyncParents.forEach((parent: { pendingAsyncDeps: number; hasTLA: any; gatherReadyAsyncParents: (arg0: any) => void }) => {
		parent.pendingAsyncDeps -= 1;

		if (parent.pendingAsyncDeps === 0) {
			readyList.push(parent);

			if (!parent.hasTLA) {
				parent.gatherReadyAsyncParents(readyList);
			}
		}
	});

	this.pendingAsyncParents = [];
};

Ep.setAsyncEvaluation = function () {
	if (this.asyncEvaluationIndex !== null) {
		if (this.status === 'evaluated') {
			return;
		}

		throw new Error('setAsyncEvaluation can only be called once');
	}

	this.asyncEvaluation = this.hasTLA || this.pendingAsyncDeps > 0;
	this.asyncEvaluationIndex = nextEvaluationIndex++;
};

Ep.setEvaluationError = function (error: any) {
	if (!this.evaluationError) {
		this.evaluationError = error;
	}

	this.allAsyncParents.forEach((parent: { setEvaluationError: (arg0: any) => void }) => {
		parent.setEvaluationError(error);
	});
};

function createSnapshot(entry: { snapshots: { [x: string]: any } }, name: string, newValue: any) {
	const newSnapshot = Object.create(null);
	const newKeys = [];

	newKeys.push(name);
	newSnapshot[name] = normalizeSnapshotValue(newValue);

	const oldSnapshot = entry.snapshots[name];

	if (
		oldSnapshot &&
		newKeys.every((key) => {
			return oldSnapshot[key] === newSnapshot[key];
		}) &&
		newKeys.length === Object.keys(oldSnapshot).length
	) {
		return oldSnapshot;
	}

	return newSnapshot;
}

function normalizeSnapshotValue(value: number | undefined) {
	if (value === void 0) return UNDEFINED;
	if (!Object.is(value, value) && isNaN(value)) return NAN;

	return value;
}

function consumeKeysGivenSnapshot(
	entry: { snapshots: { [x: string]: any }; newSetters: { [x: string]: any }; setters: { [x: string]: {} } },
	name: string | number,
	snapshot: any,
) {
	if (entry.snapshots[name] !== snapshot) {
		entry.snapshots[name] = snapshot;
		delete entry.newSetters[name];

		return Object.keys(entry.setters[name]);
	}

	const news = entry.newSetters[name];
	const newKeys = news && Object.keys(news);

	if (newKeys?.length) {
		delete entry.newSetters[name];

		return newKeys;
	}
}

function forEachSetter(
	entry: {
		setters: { [x: string]: any };
		getters: { [x: string]: any };
		namespace: object;
		module: { exports: any } | null;
		snapshots: { [x: string]: any };
		newSetters: { [x: string]: any };
	},
	names: any[] | undefined,
	callback: { (setter: any, name: any, value: any): void; (arg0: any, arg1: any, arg2: any): void },
) {
	if (names === void 0) {
		names = Object.keys(entry.setters);
	}

	names.forEach((name: string) => {
		if (name === '__esModule') return;

		const settersByKey = entry.setters[name];

		if (!settersByKey) return;

		const getter = entry.getters[name];
		const alreadyCalledConstantGetter = typeof getter === 'function' && getter.runCount > 0 && getter.constant;
		const value = getExportByName(entry, name);
		const snapshot = createSnapshot(entry, name, value);
		const keys = consumeKeysGivenSnapshot(entry, name, snapshot);

		if (keys === void 0) return;

		keys.forEach((key: string | number) => {
			const setter = settersByKey[key];

			if (!setter) {
				return;
			}

			callback(setter, name, value);

			if (alreadyCalledConstantGetter) {
				delete settersByKey[key];
			}
		});
	});
}

function getExportByName(
	entry: {
		namespace: object;
		module: { exports: any } | null;
		setters: { [x: string]: any };
		getters: { [x: string]: any };
	},
	name: PropertyKey,
) {
	if (name === '*') {
		return entry.namespace;
	}

	if (hasOwn(entry.namespace, name)) {
		return entry.namespace[name];
	}

	if (entry.module === null) return;

	const { exports } = entry.module;

	if (name === 'default' && !(getESModule(exports) && 'default' in exports)) {
		return exports;
	}

	if (exports == null) {
		return;
	}

	return exports[name];
}

function makeUniqueKey() {
	return Math.random().toString(36).replace('0.', `${++keySalt}$`);
}

function runGetter(entry: { getters: { [x: string]: any } }, name: string | number) {
	const getter = entry.getters[name];

	if (!getter) return GETTER_ERROR;

	try {
		const result = getter();

		++getter.runCount;

		return result;
	} catch (e) {
		// no op;
	}

	return GETTER_ERROR;
}

const handleAsSync = Object.create(null);

function moduleLink(this: Module, id: string, setters: any, key: any) {
	const parentEntry = Entry.getOrCreate(this.id, this);
	const absChildId = this.resolve(id);
	const childEntry = Entry.getOrCreate(absChildId);

	if (isObject(setters)) {
		childEntry.addSetters(this, setters, key);
	}

	const exports = this.require(absChildId);

	if (childEntry.module === null) {
		childEntry.module = { id: absChildId, exports };
	}

	childEntry.runSetters();

	if (childEntry.asyncEvaluation && parentEntry.status !== 'linking' && childEntry.status !== 'evaluated') {
		throw new Error('Nested imports can not import an async module');
	}

	if (childEntry.asyncEvaluation) {
		parentEntry.addAsyncDep(childEntry);
	}
}

function moduleExport(this: Module, getters: any, constant: any) {
	const entry = Entry.getOrCreate(this.id, this);

	entry.addGetters(getters, constant);

	if (this.loaded) {
		entry.runSetters();
	}
}

function moduleExportDefault(this: Module, value: any) {
	return this.export(
		{
			default() {
				return value;
			},
		},
		// true,
	);
}
function moduleExportAs(this: Module, name: string) {
	const includeDefault = name === '*+';

	const setter = (value: any) => {
		if (name === '*' || name === '*+') {
			Object.keys(value).forEach((key) => {
				if (includeDefault || key !== 'default') {
					copyKey(key, this.exports, value);
				}
			});
		} else {
			this.exports[name] = value;
		}
	};

	if (name !== '*+' && name !== '*') {
		setter.exportAs = name;
	}

	return setter;
}

function runSetters(this: Module, valueToPassThrough: any, names: any) {
	Entry.getOrCreate(this.id, this).runSetters(names, true);

	return valueToPassThrough;
}

function moduleMakeNsSetter(this: Module, includeDefault: any) {
	return this.exportAs(includeDefault ? '*+' : '*');
}

function wrapAsync(
	body: { call: (arg0: any, arg1: any, arg2: () => any, arg3: (error: any) => void) => void },
	options: { async: any; self: any },
) {
	const module = this;
	const entry = Entry.getOrCreate(module.id, module);

	entry.hasTLA = options.async;

	let waitForDepsResult: Promise<unknown> | null | undefined = undefined;

	body.call(
		options.self,
		module,
		function waitForDeps() {
			if (waitForDepsResult === undefined) {
				entry.setAsyncEvaluation();

				if (entry.pendingAsyncDeps === 0) {
					waitForDepsResult = null;

					if (entry.status !== 'evaluating') {
						entry.changeStatus('evaluating');
					}

					if (entry.asyncEvaluation && !entry.hasTLA) {
						entry.changeStatus('evaluated');
					}
				} else {
					let resolve: (arg0: () => void) => void;

					waitForDepsResult = new Promise((_resolve) => {
						resolve = _resolve;
					});

					entry._onEvaluating.push(() => {
						resolve(function checkForError() {
							if (entry.evaluationError) {
								throw entry.evaluationError;
							}
						});

						if (entry.asyncEvaluation && !entry.hasTLA) {
							entry.changeStatus('evaluated');
						}
					});
				}
			}

			return waitForDepsResult;
		},
		function finish(error: any) {
			if (error) {
				entry.setEvaluationError(error);
			}

			if (entry.asyncEvaluation) {
				entry.runSetters();
			}

			if (entry.status !== 'evaluated') {
				entry.changeStatus('evaluated');
			}

			entry.allAsyncParents = [];
		},
	);

	if (entry.evaluationError && !entry.asyncEvaluation) {
		throw entry.evaluationError;
	}
}
function enable(mod: Entry) {
	if (mod.link !== moduleLink) {
		mod.link = moduleLink;
		mod.export = moduleExport;
		mod.exportDefault = moduleExportDefault;
		mod.exportAs = moduleExportAs;
		mod.runSetters = runSetters;
		mod.wrapAsync = wrapAsync;
		mod.makeNsSetter = moduleMakeNsSetter;

		const origRequire = mod.require;

		mod.require = function (id: any) {
			const exports = origRequire.call(this, id);
			const path = this.resolve(id);
			const entry = Entry.getOrNull(path);

			if (entry && entry.asyncEvaluation && !handleAsSync[path]) {
				const promise = new Promise((resolve, reject) => {
					if (entry.status === 'evaluated') {
						if (entry.evaluationError) {
							return reject(entry.evaluationError);
						}

						return resolve(exports);
					}

					entry._onEvaluated.push(() => {
						if (entry.evaluationError) {
							return reject(entry.evaluationError);
						}

						resolve(exports);
					});
				});

				return promise;
			}

			return exports;
		};

		return true;
	}

	return false;
}

const require = meteorInstall({
	node_modules: {
		meteor: {
			modules: {
				'client.js'(_require, exports, module) {
					enable(module.constructor.prototype);
					exports.addStyles = addStyles;
				},
			},
		},
	},
});

meteorInstall({
	node_modules: {
		'@babel': {
			runtime: {
				helpers: {
					'objectSpread2.js'(_require, _exports, module) {
						module.exports = function _objectSpread2(...args: any[]) {
							return Object.assign({}, ...args);
						};
					},

					'objectWithoutProperties.js'(_require, _exports, module) {
						module.exports = function _objectWithoutProperties(
							source:
								| {
										[s: string]: unknown;
								  }
								| ArrayLike<unknown>,
							excluded: string[],
						) {
							return Object.fromEntries(
								Object.entries(source).filter(([key]) => {
									return !excluded.includes(key);
								}),
							);
						};
					},
				},
			},
		},
	},
});

queue('modules', () => {
	return {
		export() {
			return { meteorInstall };
		},
		require,
		eagerModulePaths: ['/node_modules/meteor/modules/client.js'],
		mainModulePath: '/node_modules/meteor/modules/client.js',
	};
});

export { meteorInstall };
