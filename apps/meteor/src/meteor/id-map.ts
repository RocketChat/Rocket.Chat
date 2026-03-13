import { EJSON } from './ejson.ts';

export class IdMap<TId = unknown, TValue = unknown> {
	_map = new Map<string, TValue>();

	_idStringify: (id: TId) => string;

	_idParse: (id: string) => TId;

	constructor(idStringify: (id: TId) => string = JSON.stringify, idParse: (id: string) => TId = JSON.parse) {
		this._idStringify = idStringify;
		this._idParse = idParse;
	}

	get(id: TId) {
		const key = this._idStringify(id);
		return this._map.get(key);
	}

	set(id: TId, value: TValue) {
		const key = this._idStringify(id);
		this._map.set(key, value);
	}

	remove(id: TId) {
		const key = this._idStringify(id);
		this._map.delete(key);
	}

	has(id: TId) {
		const key = this._idStringify(id);
		return this._map.has(key);
	}

	empty() {
		return this._map.size === 0;
	}

	clear() {
		this._map.clear();
	}

	forEach(iterator: (value: TValue, id: TId) => unknown) {
		for (const [key, value] of this._map) {
			const breakIfFalse = iterator.call(null, value, this._idParse(key));
			if (breakIfFalse === false) {
				return;
			}
		}
	}

	async forEachAsync(iterator: (this: null, value: TValue, id: TId) => unknown) {
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

	setDefault(id: TId, def: TValue) {
		const key = this._idStringify(id);
		if (this._map.has(key)) {
			return this._map.get(key);
		}
		this._map.set(key, def);
		return def;
	}

	clone() {
		const clone = new IdMap(this._idStringify, this._idParse);
		this._map.forEach((value, key) => {
			clone._map.set(key, EJSON.clone(value));
		});
		return clone;
	}
}
