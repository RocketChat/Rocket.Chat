/* eslint-disable @typescript-eslint/naming-convention */
import type { Join, NestedPaths, PropertyType, ArrayElement, NestedPathsOfType, UpdateFilter } from 'mongodb';

export interface Updater<T extends { _id: string }> {
	set<P extends SetProps<T>, K extends keyof P>(key: K, value: P[K]): Updater<T>;
	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T>;
	inc<K extends keyof IncProps<T>>(key: K, value: number): Updater<T>;
	addToSet<K extends keyof AddToSetProps<T>>(key: K, value: ArrayElementType<AddToSetProps<T>[K]>): Updater<T>;
	hasChanges(): boolean;
	getUpdateFilter(): UpdateFilter<T>;
	getRawUpdateFilter(): UpdateFilter<T>;
}

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

export type SetProps<TSchema extends { _id: string }> = Readonly<
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
export type UnsetProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, undefined>>;

export type IncProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, number>>;

export type AddToSetProps<TSchema extends { _id: string }> = OmitNever<GetType<SetProps<TSchema>, any[]>>;
