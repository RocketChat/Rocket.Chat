/* eslint-disable @typescript-eslint/naming-convention */
import type { IBaseModel, Updater, SetProps, UnsetProps, IncProps, AddToSetProps } from '@rocket.chat/model-typings';
import type { UpdateFilter, Filter } from 'mongodb';

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

type Keys<T extends { _id: string }> = keyof SetProps<T>;

export class UpdaterImpl<T extends { _id: string }> implements Updater<T> {
	private _set: Map<Keys<T>, any> | undefined;

	private _unset: Set<keyof UnsetProps<T>> | undefined;

	private _inc: Map<keyof IncProps<T>, number> | undefined;

	private _addToSet: Map<keyof AddToSetProps<T>, any[]> | undefined;

	private dirty = false;

	constructor(private model: IBaseModel<T>) {}

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

	async persist(query: Filter<T>): Promise<void> {
		if (this.dirty) {
			throw new Error('Updater is not dirty');
		}

		if ((process.env.NODE_ENV === 'development' || process.env.TEST_MODE) && !this.hasChanges()) {
			throw new Error('Nothing to update');
		}

		this.dirty = true;

		const update = this.getUpdateFilter();
		try {
			await this.model.updateOne(query, update);
		} catch (error) {
			console.error('Failed to update', JSON.stringify(query), JSON.stringify(update, null, 2));
			throw error;
		}
	}

	hasChanges() {
		return Object.keys(this.getUpdateFilter()).length > 0;
	}

	getUpdateFilter() {
		return {
			...(this._set && { $set: Object.fromEntries(this._set) }),
			...(this._unset && { $unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])) }),
			...(this._inc && { $inc: Object.fromEntries(this._inc) }),
			...(this._addToSet && { $addToSet: Object.fromEntries([...this._addToSet.entries()].map(([k, v]) => [k, { $each: v }])) }),
		} as unknown as UpdateFilter<T>;
	}
}

export { Updater };
