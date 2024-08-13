/* eslint-disable @typescript-eslint/naming-convention */
import type { Updater, SetProps, UnsetProps, IncProps, AddToSetProps } from '@rocket.chat/model-typings';
import type { UpdateFilter } from 'mongodb';

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

type Keys<T extends { _id: string }> = keyof SetProps<T>;

export class UpdaterImpl<T extends { _id: string }> implements Updater<T> {
	private _set: Map<Keys<T>, any> | undefined;

	private _unset: Set<keyof UnsetProps<T>> | undefined;

	private _inc: Map<keyof IncProps<T>, number> | undefined;

	private _addToSet: Map<keyof AddToSetProps<T>, any[]> | undefined;

	private dirty = false;

	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]) {
		this._set = this._set ?? new Map<Keys<T>, any>();
		this._set.set(key as Keys<T>, value);
		return this;
	}

	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T> {
		this._unset = this._unset ?? new Set<keyof UnsetProps<T>>();
		this._unset.add(key);
		return this;
	}

	inc<K extends keyof IncProps<T>>(key: K, value: number): Updater<T> {
		this._inc = this._inc ?? new Map<keyof IncProps<T>, number>();

		const prev = this._inc.get(key) ?? 0;
		this._inc.set(key, prev + value);
		return this;
	}

	addToSet<K extends keyof AddToSetProps<T>>(key: K, value: ArrayElementType<AddToSetProps<T>[K]>): Updater<T> {
		this._addToSet = this._addToSet ?? new Map<keyof AddToSetProps<T>, any[]>();

		const prev = this._addToSet.get(key) ?? [];
		this._addToSet.set(key, [...prev, value]);
		return this;
	}

	hasChanges() {
		const filter = this._getUpdateFilter();
		return this._hasChanges(filter);
	}

	private _hasChanges(filter: UpdateFilter<T>) {
		return Object.keys(filter).length > 0;
	}

	private _getUpdateFilter() {
		return {
			...(this._set && { $set: Object.fromEntries(this._set) }),
			...(this._unset && { $unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])) }),
			...(this._inc && { $inc: Object.fromEntries(this._inc) }),
			...(this._addToSet && { $addToSet: Object.fromEntries([...this._addToSet.entries()].map(([k, v]) => [k, { $each: v }])) }),
		} as unknown as UpdateFilter<T>;
	}

	getUpdateFilter() {
		if (this.dirty) {
			throw new Error('Updater is dirty');
		}
		this.dirty = true;
		const filter = this._getUpdateFilter();
		if (!this._hasChanges(filter)) {
			throw new Error('No changes to update');
		}
		return filter;
	}
}

export { Updater };
