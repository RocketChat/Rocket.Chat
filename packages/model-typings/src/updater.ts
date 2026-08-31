/* eslint-disable @typescript-eslint/naming-convention */
import type { Join, NestedPaths, PropertyType, ArrayElement, KeysOfAType, UpdateFilter } from 'mongodb';

export interface Updater<T extends { _id: string }> {
	set<K extends keyof SetProps<T>>(key: K, value: SetProps<T>[K]): Updater<T>;
	unset<K extends keyof UnsetProps<T>>(key: K): Updater<T>;
	inc<K extends keyof IncProps<T>>(key: K, value: number): Updater<T>;
	addToSet<K extends keyof AddToSetProps<T>>(key: K, value: ArrayElementType<AddToSetProps<T>[K]>): Updater<T>;
	hasChanges(): boolean;
	getUpdateFilter(): UpdateFilter<T>;
	getRawUpdateFilter(): UpdateFilter<T>;
}

type ArrayElementType<T> = T extends (infer E)[] ? E : T;

/**
 * Depth limit for NestedPaths. Starting at [1,1,1,1,1] (length 5) allows
 * 3 more levels of recursion (MongoDB's NestedPaths stops at length 8).
 * This covers all real usage (e.g. 'metrics.response.avg') while avoiding
 * the exponential type expansion that happens at deeper levels.
 */
type NestedPathsDepthLimit = [1, 1, 1, 1, 1];

/**
 * Depth-limited version of MongoDB's NestedPathsOfType.
 * The original uses NestedPaths<TSchema, []> (unlimited depth),
 * which causes exponential type expansion on large schemas.
 */
type NestedPathsOfTypeLimited<TSchema, Type> = KeysOfAType<
	{
		[Property in Join<NestedPaths<TSchema, NestedPathsDepthLimit>, '.'>]: PropertyType<TSchema, Property>;
	},
	Type
>;

export type SetProps<TSchema extends { _id: string }> = Readonly<
	{
		[Property in Join<NestedPaths<TSchema, NestedPathsDepthLimit>, '.'>]: PropertyType<TSchema, Property>;
	} & {
		[Property in `${NestedPathsOfTypeLimited<TSchema, any[]>}.$${`[${string}]` | ''}`]: ArrayElement<
			PropertyType<TSchema, Property extends `${infer Key}.$${string}` ? Key : never>
		>;
	} & {
		[Property in `${NestedPathsOfTypeLimited<TSchema, Record<string, any>[]>}.$${`[${string}]` | ''}.${string}`]: any;
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
