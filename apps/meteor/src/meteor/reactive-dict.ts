import { EJSON } from './ejson.ts';
import { ObjectID } from './mongo-id.ts';
import { Tracker, Dependency } from './tracker.ts';

type DictValue = any;

export class ReactiveDict {
	// Static properties for migration support
	static _dictsToMigrate: Record<string, ReactiveDict> = {};

	private name: string | undefined;

	// Store RAW values.
	// Optimization: Removes the need to JSON.parse() on every .get()
	private _map: Map<string, DictValue>;

	// Lazy dependencies
	private _allDep: Dependency;

	private _keyDeps: Map<string, Dependency>;

	// Specific value deps for .equals() optimization
	private _keyValueDeps: Map<string, Map<string, Dependency>>;

	constructor(dictName?: string | object, dictData?: object) {
		this._map = new Map();
		this._keyDeps = new Map();
		this._keyValueDeps = new Map();
		this._allDep = new Dependency();

		let initialData: Record<string, any> = {};

		if (dictName) {
			if (typeof dictName === 'string') {
				this.name = dictName;

				// Register for future migrations
				ReactiveDict._registerDictForMigrate(dictName, this);

				// Check for existing data from a Hot Code Push
				const migratedData = ReactiveDict._loadMigratedDict(dictName);

				if (migratedData) {
					// MIGRATION HANDLER:
					// The old version stored data as EJSON strings.
					// We parse them immediately so we can run on raw values internally.
					for (const key of Object.keys(migratedData)) {
						try {
							const val = migratedData[key];
							// Handle edge case where data might already be parsed or is 'undefined' string
							const parsed = val === 'undefined' ? undefined : EJSON.parse(val);
							this._map.set(key, parsed);
						} catch (e) {
							console.error(`ReactiveDict: Failed to migrate key "${key}"`, e);
						}
					}
					// We are done with initialization if we migrated
					return;
				}
				initialData = (dictData || {}) as Record<string, any>;
			} else if (typeof dictName === 'object') {
				// Back-compat: dictName is actually initialData
				initialData = dictName as Record<string, any>;
			} else {
				throw new Error(`Invalid ReactiveDict argument: ${dictName}`);
			}
		} else if (typeof dictData === 'object') {
			initialData = dictData as Record<string, any>;
		}

		// Batch load initial data (no reactivity needed during construction)
		if (initialData) {
			for (const key of Object.keys(initialData)) {
				this._map.set(key, initialData[key]);
			}
		}
	}

	/**
	 * Set a value for a key.
	 * Accepts: set(key, value) OR set({ key: value })
	 */
	set(keyOrObject: string | object, value?: any): void {
		if (typeof keyOrObject === 'object' && value === undefined) {
			this._setObject(keyOrObject);
			return;
		}

		const key = keyOrObject as string;
		const oldValue = this._map.get(key);

		// OPTIMIZATION:
		// Use EJSON.equals on the raw values.
		// This avoids the expensive EJSON.stringify(newValue) if the values are logically same.
		if (this._map.has(key) && EJSON.equals(oldValue, value)) {
			return;
		}

		this._map.set(key, value);

		// Notify global listeners
		this._allDep.changed();

		// Notify key listeners
		this._keyDeps.get(key)?.changed();

		// Notify specific value listeners (.equals optimization)
		// We only incur the cost of stringification if there are listeners for this specific key
		const valDeps = this._keyValueDeps.get(key);
		if (valDeps) {
			// Invalidate the OLD value's dependency
			if (oldValue !== undefined) {
				const oldStr = EJSON.stringify(oldValue);
				valDeps.get(oldStr)?.changed();
			} else {
				valDeps.get('undefined')?.changed();
			}

			// Invalidate the NEW value's dependency
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

		// Return a clone to ensure immutability of internal state
		// EJSON.clone is generally faster than parse(stringify(val))
		return val === undefined ? undefined : EJSON.clone(val);
	}

	equals(key: string, value: string | number | boolean | null | undefined | Date | ObjectID): boolean {
		// Validation logic preserved from original

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

			// Ensure nested Map structure exists
			let valDeps = this._keyValueDeps.get(key);
			if (!valDeps) {
				valDeps = new Map();
				this._keyValueDeps.set(key, valDeps);
			}

			// Ensure Dependency exists
			let dep = valDeps.get(serializedValue);
			if (!dep) {
				dep = new Tracker.Dependency();
				valDeps.set(serializedValue, dep);
			}

			const isNew = dep.depend();
			if (isNew) {
				Tracker.onInvalidate(() => {
					// Memory cleanup: remove dependency if it has no watchers
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

			// Invalidate all specific value watchers for these keys
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

	// Helper to handle object setter
	private _setObject(object: Record<string, any>) {
		for (const key of Object.keys(object)) {
			this.set(key, object[key]);
		}
	}

	// Helper to ensure key dependency exists
	private _ensureKeyDep(key: string): Dependency {
		let dep = this._keyDeps.get(key);
		if (!dep) {
			dep = new Tracker.Dependency();
			this._keyDeps.set(key, dep);
		}
		return dep;
	}

	// COMPATIBILITY:
	// This method is called by the hot-code-push system.
	// We export the data as EJSON strings to maintain compatibility with
	// the old constructor format (and ensuring simple JSON serialization of the whole dict).
	_getMigrationData(): Record<string, string> {
		const migrationData: Record<string, string> = {};
		for (const [key, value] of this._map.entries()) {
			migrationData[key] = value === undefined ? 'undefined' : EJSON.stringify(value);
		}
		return migrationData;
	}

	// Static helpers mock (assumed to exist in the environment/file)
	static _registerDictForMigrate(dictName: string, dict: ReactiveDict) {
		ReactiveDict._dictsToMigrate[dictName] = dict;
	}

	static _loadMigratedDict(_dictName: string) {
		// Logic to retrieve data from Reload package
		// This is usually handled by the framework
		return null;
	}
}
