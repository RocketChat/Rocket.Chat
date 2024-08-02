/* eslint-disable @typescript-eslint/naming-convention */
import type { IBaseModel } from '@rocket.chat/model-typings';
import type { UpdateFilter, Join, NestedPaths, PropertyType, ArrayElement, NestedPathsOfType, Filter } from 'mongodb';

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

export interface Updater<T extends { _id: string }> {
	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]): Updater<T>;
	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T>;
	inc<K extends keyof IncProps<T>>(key: K, value: number): Updater<T>;
	addToSet<K extends keyof AddToSetProps<T>>(key: K, value: AddToSetProps<T>[K]): Updater<T>;
	persist(query: Filter<T>): Promise<void>;
}

type SetProps<TSchema extends { _id: string }> = Readonly<
	{
		[Property in Join<NestedPaths<TSchema, []>, '.'>]: PropertyType<TSchema, Property>;
	} & {
		[Property in `${NestedPathsOfType<TSchema, any[]>}.$${`[${string}]` | ''}`]: ArrayElement<
			PropertyType<TSchema, Property extends `${infer Key}.$${string}` ? Key : never>
		>;
	} & {
		[Property in `${NestedPathsOfType<TSchema, Record<string, any>[]>}.$${`[${string}]` | ''}.${string}`]: any;
	}
>;

type GetType<T, K> = {
	[Key in keyof T]: K extends T[Key] ? T[Key] : never;
};

type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

// only allow optional properties
type UnsetProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, undefined>>;

type IncProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, number>>;

type AddToSetProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, any[]>>;

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

	test1<K extends UpdateFilter<T>>(key: K) {
		console.log(key);
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

		const update = {
			...(this._set && { $set: Object.fromEntries(this._set) }),
			...(this._unset && { $unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])) }),
			...(this._inc && { $inc: Object.fromEntries(this._inc) }),
			...(this._addToSet && { $addToSet: { $each: Object.fromEntries(this._addToSet) } }),
		} as unknown as UpdateFilter<T>;

		if ((process.env.NODE_ENV === 'development' || process.env.TEST_MODE) && Object.keys(update).length === 0) {
			throw new Error('Nothing to update');
		}

		this.dirty = true;

		try {
			await this.model.updateOne(query, update);
		} catch (error) {
			console.error('Failed to update', JSON.stringify(query), JSON.stringify(update, null, 2));
			throw error;
		}
	}
}
