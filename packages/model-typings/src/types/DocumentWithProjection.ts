import type { Document, FindOneAndDeleteOptions, FindOneAndUpdateOptions, FindOptions } from 'mongodb';

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type ProjectionValue = 0 | 1 | boolean;

/** Projection operators (`$slice`, `$elemMatch`, `$meta`, positional `$`) hold plain documents. */
export type ProjectionSpec = Record<string, ProjectionValue | Document>;

/**
 * `FindOptions` with a projection type that keeps `0`/`1` as literal types when the options object
 * is inferred into a generic parameter. The driver's own `FindOptions['projection']` is `Document`
 * (`{ [key: string]: any }`), which contains no literal types, so `0` and `1` widen to `number` and
 * inclusion becomes indistinguishable from exclusion.
 *
 * `ProjectionSpec | Document` looks redundant, but both members are load-bearing:
 *  - `ProjectionSpec` supplies the literal contextual type that keeps `0`/`1` narrow;
 *  - `Document` keeps assignability identical to the driver's `FindOptions`, so interface-typed
 *    projections (which get no implicit index signature) keep compiling.
 * Do not collapse the union.
 */
export type WithProjectionSpec<O> = Omit<O, 'projection'> & {
	projection?: ProjectionSpec | Document;
};

export type FindOptionsWithProjection<T extends Document = Document> = WithProjectionSpec<FindOptions<T>>;

export type FindOneAndUpdateOptionsWithProjection = WithProjectionSpec<FindOneAndUpdateOptions>;

export type FindOneAndDeleteOptionsWithProjection = WithProjectionSpec<FindOneAndDeleteOptions>;

type IdKey<T> = Extract<keyof T, '_id'>;

type InclusionKeys<P> = { [K in keyof P]-?: P[K] extends 1 | true ? K : never }[keyof P];

type ExclusionKeys<P> = { [K in keyof P]-?: P[K] extends 0 | false ? K : never }[keyof P];

/**
 * Applies a projection `P` to a document type `T`, mirroring what `BaseRaw` actually sends to the
 * server — see `doNotMixInclusionAndExclusionFields`, which strips every `0` key as soon as one key
 * is not `0`, so a mixed projection behaves as inclusion-only and still returns `_id`.
 *
 * Bails out to `T` whenever the projection cannot be read statically: dotted paths, `$`-operators,
 * computed keys, or values that are not `0`/`1`/`false`/`true` literals.
 */
export type ApplyProjection<T, P> = [keyof P] extends [keyof T]
	? [keyof P] extends [InclusionKeys<P> | ExclusionKeys<P>]
		? [InclusionKeys<P>] extends [never]
			? Omit<T, ExclusionKeys<P> & keyof T>
			: Prettify<Pick<T, (InclusionKeys<P> & keyof T) | IdKey<T>>>
		: T
	: T;

export type DocumentWithProjection<T extends Document, O> = O extends { projection: infer P }
	? P extends ProjectionSpec
		? ApplyProjection<T, P>
		: T
	: T;

/**
 * Applies a projection the way the **driver** sees it. `findOneAndUpdate` / `findOneAndDelete` go
 * straight to the collection, so they get none of `BaseRaw`'s rewriting. Two consequences:
 *  - `_id` comes back unless the projection excludes it explicitly, so `{ a: 1, _id: 0 }` really does
 *    drop `_id` here, where the `find` path would have kept it;
 *  - mixing inclusion with any other exclusion is a server error, so there is nothing useful to
 *    describe and we fall back to `T`.
 */
type ApplyDriverProjection<T, P> = [keyof P] extends [keyof T]
	? [keyof P] extends [InclusionKeys<P> | ExclusionKeys<P>]
		? [InclusionKeys<P>] extends [never]
			? Omit<T, ExclusionKeys<P> & keyof T>
			: [Exclude<ExclusionKeys<P>, '_id'>] extends [never]
				? Prettify<Pick<T, (InclusionKeys<P> & keyof T) | Exclude<IdKey<T>, ExclusionKeys<P>>>>
				: T
		: T
	: T;

export type DocumentWithDriverProjection<T extends Document, O> = O extends { projection: infer P }
	? P extends ProjectionSpec
		? ApplyDriverProjection<T, P>
		: T
	: T;
