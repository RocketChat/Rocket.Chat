/**
 * Compile-time assertions for {@link DocumentWithProjection}. Nothing here is meant to run; it
 * exists so that `tsc -p tsconfig.json` fails if the projection inference regresses.
 */
import type { Document } from 'mongodb';

import type { DocumentWithDriverProjection, DocumentWithProjection, FindOptionsWithProjection } from './DocumentWithProjection';

type Expect<T extends true> = T;

/** Strict type identity. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** Mutual assignability — tolerant of `Prettify`/`Pick` representation differences. */
type Equivalent<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type Doc = {
	_id: string;
	username?: string;
	password: string;
	name: string;
	roles: string[];
};

type Project<P> = DocumentWithProjection<Doc, { projection: P }>;

/**
 * The invariant the whole backward-compatibility story rests on: `projection` is optional in
 * `FindOptionsWithProjection`, so the default `O` does not match `{ projection: infer P }` and the
 * result collapses to the document type. Making `projection` required would silently change the
 * meaning of every call site that passes an explicit generic.
 */
export type NoProjectionCollapsesToDocument = Expect<Equal<DocumentWithProjection<Doc, FindOptionsWithProjection<Doc>>, Doc>>;

export type UndefinedOptionsCollapsesToDocument = Expect<Equal<DocumentWithProjection<Doc, undefined>, Doc>>;

export type Inclusion = Expect<Equivalent<Project<{ username: 1 }>, Pick<Doc, '_id' | 'username'>>>;

export type InclusionKeepsIdImplicitly = Expect<Equivalent<Project<{ name: 1 }>, Pick<Doc, '_id' | 'name'>>>;

export type BooleanInclusion = Expect<Equivalent<Project<{ username: true }>, Pick<Doc, '_id' | 'username'>>>;

export type Exclusion = Expect<Equivalent<Project<{ password: 0 }>, Omit<Doc, 'password'>>>;

export type BooleanExclusion = Expect<Equivalent<Project<{ password: false; name: false }>, Omit<Doc, 'password' | 'name'>>>;

export type ExclusionCanDropId = Expect<Equivalent<Project<{ _id: 0 }>, Omit<Doc, '_id'>>>;

/** `doNotMixInclusionAndExclusionFields` drops the exclusion keys at runtime, so `_id` survives a mix. */
export type MixedBehavesAsInclusion = Expect<Equivalent<Project<{ name: 1; password: 0 }>, Pick<Doc, '_id' | 'name'>>>;

export type MixedBooleanBehavesAsInclusion = Expect<Equivalent<Project<{ name: true; password: false }>, Pick<Doc, '_id' | 'name'>>>;

export type MixedNotationBehavesAsInclusion = Expect<Equivalent<Project<{ name: 1; password: false }>, Pick<Doc, '_id' | 'name'>>>;

export type MixedNotationExclusionStaysExclusion = Expect<
	Equivalent<Project<{ password: 0; name: false }>, Omit<Doc, 'password' | 'name'>>
>;

export type MixedKeepsIdEvenWhenExcluded = Expect<Equivalent<Project<{ _id: 0; name: 1 }>, Pick<Doc, '_id' | 'name'>>>;

export type MixedKeepsIdEvenWhenExcludedWithBoolean = Expect<Equivalent<Project<{ _id: false; name: 1 }>, Pick<Doc, '_id' | 'name'>>>;

// Everything below must bail out to the full document rather than guess.

export type DottedPathBailsOut = Expect<Equal<Project<{ 'roles.0': 1 }>, Doc>>;

export type OperatorBailsOut = Expect<Equal<Project<{ roles: { $slice: 5 } }>, Doc>>;

export type MetaBailsOut = Expect<Equal<Project<{ $meta: 'textScore' }>, Doc>>;

export type NonLiteralValueBailsOut = Expect<Equal<Project<{ name: number }>, Doc>>;

export type UnknownKeyBailsOut = Expect<Equal<Project<{ name: 1; notInDoc: 1 }>, Doc>>;

export type WideProjectionBailsOut = Expect<Equal<Project<Record<string, 0 | 1>>, Doc>>;

// Documents with a string index signature collapse `keyof T` to `string | number`, which used to
// make the implicit `_id` disappear from inclusion projections.

type IndexedDoc = {
	_id: string;
	name: string;
	[k: string]: any;
};

export type IndexSignatureKeepsId = Expect<
	Equivalent<DocumentWithProjection<IndexedDoc, { projection: { name: 1 } }>, { _id: string; name: string }>
>;

// When a call sits in a contextually typed position (argument, object literal property), inference
// through the return type would drive the document type param to its `Document` constraint instead
// of its default. The `NoInfer` inside `DocumentWithProjection` blocks that.

declare const contextualProbe: {
	findOne<P extends Document = Doc, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): DocumentWithProjection<P, O> | null;
};

export const contextualInferenceKeepsDefault: Pick<Doc, '_id' | 'username'> | null = contextualProbe.findOne({
	projection: { username: 1 },
});

// `findOneAndUpdate` / `findOneAndDelete` reach the driver directly, so they get none of BaseRaw's
// rewriting. The two rules below are where driver semantics diverge from the `find` path.

type DriverProject<P> = DocumentWithDriverProjection<Doc, { projection: P }>;

export type DriverInclusion = Expect<Equivalent<DriverProject<{ username: 1 }>, Pick<Doc, '_id' | 'username'>>>;

export type DriverExclusion = Expect<Equivalent<DriverProject<{ password: 0 }>, Omit<Doc, 'password'>>>;

/** `find` keeps `_id` here because BaseRaw strips the `0`; the driver really drops it. */
export type DriverExplicitIdExclusionDropsId = Expect<Equivalent<DriverProject<{ name: 1; _id: 0 }>, Pick<Doc, 'name'>>>;

/** Mixing inclusion with a non-`_id` exclusion is a server error, so there is nothing to describe. */
export type DriverGenuineMixBailsOut = Expect<Equal<DriverProject<{ name: 1; password: 0 }>, Doc>>;

export type DriverNoProjectionCollapses = Expect<Equal<DocumentWithDriverProjection<Doc, undefined>, Doc>>;
