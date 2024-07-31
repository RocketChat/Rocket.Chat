/* eslint-disable @typescript-eslint/naming-convention */
import type { IBaseModel } from '@rocket.chat/model-typings';
import type { UpdateFilter, Join, NestedPaths, PropertyType, ArrayElement, NestedPathsOfType } from 'mongodb';

export interface Updater<T extends { _id: string }> {
	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]): Updater<T>;
	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T>;
	// inc<K extends keyof T>(key: K, value: number): Updater<T>;
	// dec<K extends keyof T>(key: K, value: number): Updater<T>;
	persist(): Promise<void>;
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
	private _set = new Map<Keys<T>, any>();

	private _unset = new Set<keyof UnsetProps<T>>();

	private _inc = new Map<keyof T, number>();

	private _dec = new Map<keyof T, number>();

	constructor(private model: IBaseModel<T>) {}

	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]) {
		this._set.set(key as Keys<T>, value);
		return this;
	}

	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T> {
		this._unset.add(key);
		return this;
	}

	test1<K extends UpdateFilter<T>>(key: K) {
		console.log(key);
	}

	inc<K extends keyof T>(key: K, value: number): Updater<T> {
		this._inc.set(key, value);
		return this;
	}

	dec<K extends keyof T>(key: K, value: number): Updater<T> {
		this._dec.set(key, value);
		return this;
	}

	async persist(): Promise<void> {
		await this.model.updateOne({}, {
			$set: Object.fromEntries(this._set),
			$unset: Object.fromEntries([...this._unset.values()].map((k) => [k, 1])),
			$inc: Object.fromEntries(this._inc),
			$dec: Object.fromEntries(this._dec),
		} as unknown as UpdateFilter<T>);
	}
}
