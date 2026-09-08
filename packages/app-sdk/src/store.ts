/**
 * Typed persistence.
 *
 * Legacy persistence is an untyped bag: `persistence.create(data: object)` and
 * `persistenceRead.readByAssociation(assoc)` returning `Array<object>`. You cast
 * everywhere and there is no schema.
 *
 * `defineStore(...)` declares named collections, each with a record schema and
 * its index set. The collection map's type flows into `ctx.store` (see
 * context.ts `StoreClient`) so `ctx.store.subscriptions.find({ userId })` is
 * fully typed — and so that `find` accepts only a key set a declared index
 * serves as a prefix (`ServedQuery`). "Associations" (the legacy tie between app
 * data and a room/message/user) survive as an optional per-record tag used for
 * cascade cleanup — see rfc/18a-surface-store-associations.md, which has not
 * settled whether they stay.
 */

import type { Infer, Schema } from './schema';

/** One index key: a single field, or a compound key in its declared order. */
export type IndexKey<T> = (keyof T & string) | readonly (keyof T & string)[];

/** The record fields the host can build a TTL index on. MongoDB expires dates, not strings. */
export type DateKeys<T> = { [K in keyof T]-?: Date extends T[K] ? K & string : never }[keyof T];

/**
 * One declared index. The declaration is the query contract: `find` accepts a
 * key set only if some index serves it as a prefix, so an app that wants a
 * query declares the index for it.
 *
 * ```ts
 * { on: ['userId', 'dueAt'] }        // serves { userId } and { userId, dueAt }
 * { on: 'roomId', unique: true }     // one record per room
 * { on: 'expiresAt', ttl: '30d' }    // the host builds the TTL index
 * ```
 */
export type IndexSpec<T> = { on: IndexKey<T>; unique?: boolean; ttl?: never } | { on: DateKeys<T>; ttl: string; unique?: never };

export interface CollectionDef<T extends object> {
	schema: Schema<T>;
	/** The indexes the host builds at install. Also the collection's query surface. */
	indexes?: readonly IndexSpec<T>[];
}

export type StoreMap = Record<string, CollectionDef<any>>;

/**
 * Binds each collection's index keys to that collection's own record type.
 * `StoreMap` alone cannot: `CollectionDef<any>` accepts any field name. Passing
 * `M & ValidatedStore<M>` re-checks the argument once `M` is known, so an index
 * on an undeclared field is a compile error where it is written.
 */
export type ValidatedStore<M extends StoreMap> = {
	[K in keyof M]: CollectionDef<Infer<M[K]['schema']> extends infer R ? (R extends object ? R : never) : never>;
};

export const STORE = Symbol.for('rc.app-sdk.store');

export type StoreDefinition<M extends StoreMap> = {
	readonly [STORE]: true;
	readonly map: M;
};

/** One collection as `ctx.store` sees it: the record it holds, and the indexes that answer a `find`. */
export interface CollectionShape {
	record: object;
	indexes: readonly IndexSpec<any>[];
}

/** The collection-shape map inferred from a store definition (feeds `AppEnv['store']`). */
export type InferStore<D> =
	D extends StoreDefinition<infer M>
		? {
				[K in keyof M]: {
					record: Infer<M[K]['schema']> extends infer R ? (R extends object ? R : never) : never;
					indexes: M[K] extends { indexes: infer I } ? (I extends readonly IndexSpec<any>[] ? I : readonly []) : readonly [];
				};
			}
		: Record<string, never>;

/** `on` as a tuple, so the prefixes can be walked left to right. */
type KeyTuple<On> = On extends readonly string[] ? On : On extends string ? readonly [On] : never;

/** Every prefix of one index key, as the query object that prefix answers. */
type PrefixQuery<T, L extends readonly unknown[]> = L extends readonly [infer H, ...infer R]
	? H extends keyof T
		? Pick<T, H> | (Pick<T, H> & PrefixQuery<T, R>)
		: never
	: never;

/**
 * The key sets `find` accepts: the prefixes of every declared index.
 *
 * ```ts
 * indexes: [{ on: ['userId', 'dueAt'] }]
 * find({ userId })            // ✅ a prefix
 * find({ userId, dueAt })     // ✅ the whole key
 * find({ dueAt })             // ❌ no index starts with dueAt
 * ```
 */
export type ServedQuery<S extends CollectionShape> = S['indexes'] extends readonly (infer I)[]
	? I extends { on: infer On }
		? PrefixQuery<S['record'], KeyTuple<On>>
		: never
	: never;

export function defineStore<const M extends StoreMap>(map: M & ValidatedStore<M>): StoreDefinition<M> {
	return { [STORE]: true, map };
}
