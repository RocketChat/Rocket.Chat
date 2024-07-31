/* eslint-disable @typescript-eslint/naming-convention */
import type { Join, NestedPaths, PropertyType, ArrayElement, NestedPathsOfType } from 'mongodb';

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
