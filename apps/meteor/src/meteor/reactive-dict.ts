import { EJSON } from './ejson.ts';
import { ObjectID } from './mongo-id.ts';
import { Tracker } from './tracker.ts';

type DictValue = any;

export class ReactiveDict {
	static _dictsToMigrate: Record<string, ReactiveDict> = {};

	private name: string | undefined;

	private _map = new Map<string, DictValue>();

	private _allDep = new Tracker.Dependency();

	private _keyDeps = new Map<string, Tracker.Dependency>();

	private _keyValueDeps = new Map<string, Map<string, Tracker.Dependency>>();

	constructor(dictName?: string | object, dictData?: object) {
		let initialData: Record<string, any> = {};

		if (dictName) {
			if (typeof dictName === 'string') {
				this.name = dictName;
				ReactiveDict._registerDictForMigrate(dictName, this);
				const migratedData = ReactiveDict._loadMigratedDict(dictName);

				if (migratedData) {
					for (const key of Object.keys(migratedData)) {
						try {
							const val = migratedData[key];
							const parsed = val === 'undefined' ? undefined : EJSON.parse(val);
							this._map.set(key, parsed);
						} catch (e) {
							console.error(`ReactiveDict: Failed to migrate key "${key}"`, e);
						}
					}
					return;
				}
				initialData = (dictData || {}) as Record<string, any>;
			} else if (typeof dictName === 'object') {
				initialData = dictName as Record<string, any>;
			} else {
				throw new Error(`Invalid ReactiveDict argument: ${dictName}`);
			}
		} else if (typeof dictData === 'object') {
			initialData = dictData as Record<string, any>;
		}
		if (initialData) {
			for (const key of Object.keys(initialData)) {
				this._map.set(key, initialData[key]);
			}
		}
	}

	set(keyOrObject: string | object, value?: any): void {
		if (typeof keyOrObject === 'object' && value === undefined) {
			this._setObject(keyOrObject);
			return;
		}

		const key = keyOrObject as string;
		const oldValue = this._map.get(key);
		if (this._map.has(key) && EJSON.equals(oldValue, value)) {
			return;
		}

		this._map.set(key, value);
		this._allDep.changed();
		this._keyDeps.get(key)?.changed();
		const valDeps = this._keyValueDeps.get(key);
		if (valDeps) {
			if (oldValue !== undefined) {
				const oldStr = EJSON.stringify(oldValue);
				valDeps.get(oldStr)?.changed();
			} else {
				valDeps.get('undefined')?.changed();
			}
			if (value !== undefined) {
				const newStr = EJSON.stringify(value);
				valDeps.get(newStr)?.changed();
			} else {
				valDeps.get('undefined')?.changed();
			}
		}
	}

	setDefault(keyOrObject: string | object, value?: any): void {
		if (typeof keyOrObject === 'object' && value === undefined) {
			const obj = keyOrObject as Record<string, any>;
			for (const key of Object.keys(obj)) {
				this.setDefault(key, obj[key]);
			}
			return;
		}

		const key = keyOrObject as string;
		if (!this._map.has(key)) {
			this.set(key, value);
		}
	}

	get(key: string): any {
		this._ensureKeyDep(key).depend();

		const val = this._map.get(key);
		return val === undefined ? undefined : EJSON.clone(val);
	}

	equals(key: string, value: string | number | boolean | null | undefined | Date | ObjectID): boolean {
		if (
			typeof value !== 'string' &&
			typeof value !== 'number' &&
			typeof value !== 'boolean' &&
			typeof value !== 'undefined' &&
			!(value instanceof Date) &&
			!(value instanceof ObjectID) &&
			value !== null
		) {
			throw new Error('ReactiveDict.equals: value must be scalar');
		}

		if (Tracker.active) {
			const serializedValue = value === undefined ? 'undefined' : EJSON.stringify(value);
			let valDeps = this._keyValueDeps.get(key);
			if (!valDeps) {
				valDeps = new Map();
				this._keyValueDeps.set(key, valDeps);
			}
			let dep = valDeps.get(serializedValue);
			if (!dep) {
				dep = new Tracker.Dependency();
				valDeps.set(serializedValue, dep);
			}

			const isNew = dep.depend();
			if (isNew) {
				Tracker.onInvalidate(() => {
					if (!dep.hasDependents()) {
						valDeps.delete(serializedValue);
						if (valDeps.size === 0) {
							this._keyValueDeps.delete(key);
						}
					}
				});
			}
		}

		const currentValue = this._map.get(key);
		return EJSON.equals(currentValue, value);
	}

	all(): Record<string, any> {
		this._allDep.depend();
		const ret: Record<string, any> = {};
		for (const [key, val] of this._map.entries()) {
			ret[key] = EJSON.clone(val);
		}
		return ret;
	}

	clear(): void {
		const oldKeys = Array.from(this._map.keys());
		this._map.clear();

		this._allDep.changed();

		for (const key of oldKeys) {
			this._keyDeps.get(key)?.changed();
			const valDeps = this._keyValueDeps.get(key);
			if (valDeps) {
				for (const dep of valDeps.values()) {
					dep.changed();
				}
				valDeps.clear(); // Safe to clear since we deleted the key
			}
		}
	}

	delete(key: string): boolean {
		if (!this._map.has(key)) return false;

		const oldValue = this._map.get(key);
		this._map.delete(key);

		this._allDep.changed();
		this._keyDeps.get(key)?.changed();

		const valDeps = this._keyValueDeps.get(key);
		if (valDeps) {
			if (oldValue !== undefined) {
				valDeps.get(EJSON.stringify(oldValue))?.changed();
			}
			valDeps.get('undefined')?.changed();
		}

		return true;
	}

	destroy(): void {
		this.clear();
		if (this.name && ReactiveDict._dictsToMigrate[this.name]) {
			delete ReactiveDict._dictsToMigrate[this.name];
		}
	}

	private _setObject(object: Record<string, any>) {
		for (const key of Object.keys(object)) {
			this.set(key, object[key]);
		}
	}

	private _ensureKeyDep(key: string): Tracker.Dependency {
		let dep = this._keyDeps.get(key);
		if (!dep) {
			dep = new Tracker.Dependency();
			this._keyDeps.set(key, dep);
		}
		return dep;
	}

	_getMigrationData(): Record<string, string> {
		const migrationData: Record<string, string> = {};
		for (const [key, value] of this._map.entries()) {
			migrationData[key] = value === undefined ? 'undefined' : EJSON.stringify(value);
		}
		return migrationData;
	}

	static _registerDictForMigrate(dictName: string, dict: ReactiveDict) {
		ReactiveDict._dictsToMigrate[dictName] = dict;
	}

	static _loadMigratedDict(_dictName: string) {
		return null;
	}
}
