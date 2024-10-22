/* eslint-disable @typescript-eslint/naming-convention */
import type { Updater, SetProps, UnsetProps, IncProps, AddToSetProps, UpdaterCompatibleUpdateFilter } from '@rocket.chat/model-typings';
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
		this.removeKey(key as keyof T);
		this._set = this._set ?? new Map<Keys<T>, any>();
		this._set.set(key as Keys<T>, value);

		return this;
	}

	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T> {
		this.removeKey(key as keyof T);

		this._unset = this._unset ?? new Set<keyof UnsetProps<T>>();
		this._unset.add(key);
		return this;
	}

	inc<K extends keyof IncProps<T>>(key: K, value: number): Updater<T> {
		this._unset?.delete(key as keyof UnsetProps<T>);

		this._inc = this._inc ?? new Map<keyof IncProps<T>, number>();

		const prev = this._inc.get(key) ?? 0;
		this._inc.set(key, prev + value);
		return this;
	}

	addToSet<K extends keyof AddToSetProps<T>>(key: K, value: ArrayElementType<AddToSetProps<T>[K]>): Updater<T> {
		this._unset?.delete(key as keyof UnsetProps<T>);

		// If the value is being $set in a previous operation, include this new value there
		if (this._set?.has(key) && this.combineValues(key, this._set.get(key), value)) {
			return this;
		}

		this._addToSet = this._addToSet ?? new Map<keyof AddToSetProps<T>, any[]>();

		const prev = this._addToSet.get(key) ?? [];
		this._addToSet.set(key, [...prev, value]);
		return this;
	}

	hasChanges() {
		const filter = this._getUpdateFilter();
		return this._hasChanges(filter);
	}

	private removeKey(key: keyof T): void {
		this._set?.delete(key as keyof SetProps<T>);
		this._unset?.delete(key as keyof UnsetProps<T>);
		this._addToSet?.delete(key as keyof AddToSetProps<T>);
		this._inc?.delete(key as keyof IncProps<T>);
	}

	private _hasChanges(filter: UpdateFilter<T>) {
		return Object.keys(filter).length > 0;
	}

	private _getUpdateFilter() {
		return {
			...(this._set && this._set.size > 0 && { $set: Object.fromEntries(this._set) }),
			...(this._unset && this._unset.size > 0 && { $unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])) }),
			...(this._inc && this._inc.size > 0 && { $inc: Object.fromEntries(this._inc) }),
			...(this._addToSet &&
				this._addToSet.size > 0 && { $addToSet: Object.fromEntries([...this._addToSet.entries()].map(([k, v]) => [k, { $each: v }])) }),
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

	combineValues<P extends AddToSetProps<T>, K extends keyof P>(key: K, set: P[K], addToSet: ArrayElementType<P[K]>): boolean {
		if (!set || typeof set !== 'object' || !Array.isArray(set)) {
			return false;
		}

		if ((set as any[]).includes(addToSet)) {
			return true;
		}

		this.set(key as keyof SetProps<T>, [...set, addToSet] as P[K]);
		return true;
	}

	addUpdateFilter(update: UpdaterCompatibleUpdateFilter<T>): Updater<T> {
		const { $set, $unset, $inc, $addToSet, ...otherOperations } = update;

		if (Object.keys(otherOperations).length) {
			throw new Error('Incompatible update operation.');
		}

		if ($unset) {
			for (const key in $unset) {
				if (!Object.hasOwnProperty.call($unset, key)) {
					continue;
				}

				this.unset(key as keyof UnsetProps<T>);
			}
		}

		if ($set) {
			for (const key in $set) {
				if (!Object.hasOwnProperty.call($set, key)) {
					continue;
				}

				this.set(key as keyof SetProps<T>, $set[key]);
			}
		}

		if ($inc) {
			for (const key in $inc) {
				if (!Object.hasOwnProperty.call($inc, key)) {
					continue;
				}

				const value = $inc[key] ?? 1;
				// Mongo supports other numeric types here, but the Updater doesn't
				if (typeof value !== 'number') {
					throw new Error('Incompatible $inc value');
				}

				this.inc(key as keyof IncProps<T>, value);
			}
		}

		if ($addToSet) {
			for (const key in $addToSet) {
				if (!Object.hasOwnProperty.call($addToSet, key)) {
					continue;
				}

				const value = $addToSet[key];
				const keyName = key as keyof AddToSetProps<T>;

				if (value && typeof value === 'object' && '$each' in value) {
					for (const subValue of value.$each) {
						this.addToSet(keyName, subValue);
					}
				} else {
					this.addToSet(keyName, value);
				}
			}
		}

		return this;
	}
}

export { Updater };
