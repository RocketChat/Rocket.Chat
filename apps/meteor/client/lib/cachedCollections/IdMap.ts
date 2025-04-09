import { clone } from './common';

interface IIdMap<TId, TValue> {
	get(id: TId): TValue | undefined;
	set(id: TId, value: TValue): void;
	remove(id: TId): void;
	has(id: TId): boolean;
	empty(): boolean;
	clear(): void;
	forEach(iterator: (value: TValue, key: TId) => boolean | void): void;
	forEachAsync(iterator: (value: TValue, key: TId) => Promise<boolean | void>): Promise<void>;
	size(): number;
}

export class IdMap<TId, TValue> implements IIdMap<TId, TValue> {
	private _map: Map<TId, TValue> = new Map();

	// Some of these methods are designed to match methods on OrderedDict, since
	// (eg) ObserveMultiplex and _CachingChangeObserver use them interchangeably.
	// (Conceivably, this should be replaced with "UnorderedDict" with a specific
	// set of methods that overlap between the two.)

	get(id: TId): TValue | undefined {
		return this._map.get(id);
	}

	set(id: TId, value: TValue): void {
		this._map.set(id, value);
	}

	remove(id: TId): void {
		this._map.delete(id);
	}

	has(id: TId): boolean {
		return this._map.has(id);
	}

	empty(): boolean {
		return this._map.size === 0;
	}

	clear(): void {
		this._map.clear();
	}

	// Iterates over the items in the map. Return `false` to break the loop.
	forEach(callback: (value: TValue, id: TId) => boolean | void): void {
		for (const [key, value] of this._map) {
			if (callback.call(null, value, key) === false) {
				return;
			}
		}
	}

	async forEachAsync(callback: (value: TValue, id: TId) => Promise<boolean | void>): Promise<void> {
		for await (const [key, value] of this._map) {
			if ((await callback.call(null, value, key)) === false) {
				return;
			}
		}
	}

	size(): number {
		return this._map.size;
	}

	setDefault(id: TId, def: TValue): TValue {
		if (this._map.has(id)) {
			return this._map.get(id)!;
		}
		this._map.set(id, def);
		return def;
	}

	// Assumes that values are EJSON-cloneable, and that we don't need to clone
	// IDs (ie, that nobody is going to mutate an ObjectId).
	clone(): IdMap<TId, TValue> {
		const copy = new IdMap<TId, TValue>();
		// copy directly to avoid stringify/parse overhead
		this._map.forEach((value, key) => {
			copy._map.set(key, clone(value));
		});
		return copy;
	}

	values(): IterableIterator<TValue> {
		return this._map.values();
	}
}
