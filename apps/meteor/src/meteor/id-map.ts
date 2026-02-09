import { EJSON } from './ejson.ts';
import { Package } from './package-registry.ts';

export class IdMap {
	_map = new Map();

	_idStringify: (id: unknown) => string;

	_idParse: (id: string) => unknown = JSON.parse;

	constructor(idStringify: (id: unknown) => string = JSON.stringify, idParse: (id: string) => unknown = JSON.parse) {
		this._idStringify = idStringify;
		this._idParse = idParse;
	}

	// Some of these methods are designed to match methods on OrderedDict, since
	// (eg) ObserveMultiplex and _CachingChangeObserver use them interchangeably.
	// (Conceivably, this should be replaced with "UnorderedDict" with a specific
	// set of methods that overlap between the two.)

	get(id: unknown) {
		const key = this._idStringify(id);
		return this._map.get(key);
	}

	set(id: unknown, value: unknown) {
		const key = this._idStringify(id);
		this._map.set(key, value);
	}

	remove(id: unknown) {
		const key = this._idStringify(id);
		this._map.delete(key);
	}

	has(id: unknown) {
		const key = this._idStringify(id);
		return this._map.has(key);
	}

	empty() {
		return this._map.size === 0;
	}

	clear() {
		this._map.clear();
	}

	// Iterates over the items in the map. Return `false` to break the loop.
	forEach(iterator: (value: unknown, id: unknown) => unknown) {
		// don't use _.each, because we can't break out of it.
		for (const [key, value] of this._map) {
			const breakIfFalse = iterator.call(null, value, this._idParse(key));
			if (breakIfFalse === false) {
				return;
			}
		}
	}

	async forEachAsync(iterator: (this: null, value: unknown, id: unknown) => unknown) {
		for (const [key, value] of this._map) {
			// eslint-disable-next-line no-await-in-loop
			if ((await iterator.call(null, value, this._idParse(key))) === false) {
				return;
			}
		}
	}

	size() {
		return this._map.size;
	}

	setDefault(id: unknown, def: unknown) {
		const key = this._idStringify(id);
		if (this._map.has(key)) {
			return this._map.get(key);
		}
		this._map.set(key, def);
		return def;
	}

	// Assumes that values are EJSON-cloneable, and that we don't need to clone
	// IDs (ie, that nobody is going to mutate an ObjectId).
	clone() {
		const clone = new IdMap(this._idStringify, this._idParse);
		// copy directly to avoid stringify/parse overhead
		this._map.forEach((value, key) => {
			clone._map.set(key, EJSON.clone(value));
		});
		return clone;
	}
}

Package['id-map'] = {
	IdMap,
};
