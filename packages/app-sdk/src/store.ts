/**
 * Typed persistence.
 *
 * Legacy persistence is an untyped bag: `persistence.create(data: object)` and
 * `persistenceRead.readByAssociation(assoc)` returning `Array<object>`. You cast
 * everywhere and there is no schema.
 *
 * `defineStore(...)` declares named collections, each with a record schema. The
 * collection map's type flows into `ctx.store` (see context.ts `StoreClient`) so
 * `ctx.store.subscriptions.find({ userId })` is fully typed. "Associations" (the
 * legacy tie between app data and a room/message/user) survive as an optional
 * per-record tag used for cascade cleanup — the useful part of the old model,
 * without the untyped surface.
 */

import type { Infer, Schema } from './schema';

export interface CollectionDef<T extends object> {
	schema: Schema<T>;
	/** Fields the runtime should index for `find` queries. */
	indexes?: (keyof T & string)[];
}

export type StoreMap = Record<string, CollectionDef<any>>;

export const STORE = Symbol.for('rc.app-sdk.store');

export type StoreDefinition<M extends StoreMap> = {
	readonly [STORE]: true;
	readonly map: M;
};

/** The collection-shape map inferred from a store definition (feeds `AppEnv['store']`). */
export type InferStore<D> = D extends StoreDefinition<infer M>
	? { [K in keyof M]: M[K] extends { schema: infer Sc } ? (Infer<Sc> extends object ? Infer<Sc> : never) : never }
	: Record<string, never>;

export function defineStore<const M extends StoreMap>(map: M): StoreDefinition<M> {
	return { [STORE]: true, map };
}
