/* eslint-disable @typescript-eslint/naming-convention */
import type { IBaseModel } from '@rocket.chat/model-typings';
import type { UpdateFilter, Join, NestedPaths, PropertyType, ArrayElement, NestedPathsOfType, Filter } from 'mongodb';

export interface Updater<T extends { _id: string }> {
	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]): Updater<T>;
	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T>;
	// inc<K extends keyof T>(key: K, value: number): Updater<T>;
	// dec<K extends keyof T>(key: K, value: number): Updater<T>;
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

type GetNullables<T> = {
	[Key in keyof T]: undefined extends T[Key] ? 1 : never;
};

type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

// only allow optional properties
type UnsetProps<TSchema extends { _id: string }> = OmitNever<GetNullables<SetProps<TSchema>>>;

type Keys<T extends { _id: string }> = keyof SetProps<T>;

export class UpdaterImpl<T extends { _id: string }> implements Updater<T> {
	private _set: Map<Keys<T>, any> | undefined;

	private _unset: Set<keyof UnsetProps<T>> | undefined;

	private _inc: Map<keyof T, number> | undefined;

	private _dec: Map<keyof T, number> | undefined;

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

	inc<K extends keyof T>(key: K, value: number): Updater<T> {
		this._inc = this._inc ?? new Map<keyof T, number>();
		this._inc.set(key, value);
		return this;
	}

	dec<K extends keyof T>(key: K, value: number): Updater<T> {
		this._dec = this._dec ?? new Map<keyof T, number>();
		this._dec.set(key, value);
		return this;
	}

	async persist(query: Filter<T>): Promise<void> {
		if (this.dirty) {
			throw new Error('Updater is not dirty');
		}

		this.dirty = true;
		await this.model.updateOne(query, {
			...(this._set && { $set: Object.fromEntries(this._set) }),
			...(this._unset && { $unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])) }),
			...(this._inc && { $inc: Object.fromEntries(this._inc) }),
			...(this._dec && { $dec: Object.fromEntries(this._dec) }),
		} as unknown as UpdateFilter<T>);
	}
}
