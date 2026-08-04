/**
 * Compile-time assertions for {@link DocumentWithProjection}. This file emits nothing; it exists so
 * that `tsc -p tsconfig.json` fails if the projection inference regresses.
 */
import type { DocumentWithProjection, FindOptionsWithProjection } from './DocumentWithProjection';

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

/** `doNotMixInclusionAndExclusionFields` drops the `0` keys at runtime, so `_id` survives a mix. */
export type MixedBehavesAsInclusion = Expect<Equivalent<Project<{ name: 1; password: 0 }>, Pick<Doc, '_id' | 'name'>>>;

export type MixedKeepsIdEvenWhenExcluded = Expect<Equivalent<Project<{ _id: 0; name: 1 }>, Pick<Doc, '_id' | 'name'>>>;

// Everything below must bail out to the full document rather than guess.

export type DottedPathBailsOut = Expect<Equal<Project<{ 'roles.0': 1 }>, Doc>>;

export type OperatorBailsOut = Expect<Equal<Project<{ roles: { $slice: 5 } }>, Doc>>;

export type MetaBailsOut = Expect<Equal<Project<{ $meta: 'textScore' }>, Doc>>;

export type NonLiteralValueBailsOut = Expect<Equal<Project<{ name: number }>, Doc>>;

export type UnknownKeyBailsOut = Expect<Equal<Project<{ name: 1; notInDoc: 1 }>, Doc>>;

export type WideProjectionBailsOut = Expect<Equal<Project<Record<string, 0 | 1>>, Doc>>;
