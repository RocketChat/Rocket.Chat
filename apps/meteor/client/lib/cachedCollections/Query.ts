/* eslint-disable @typescript-eslint/naming-convention */
import type { Cursor, Options } from './Cursor';
import type { IdMap } from './IdMap';

interface BaseQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> {
	readonly cursor: Cursor<T, TOptions, TProjection>;
	dirty: boolean;
	readonly predicate: (doc: T) => boolean;
	readonly projectionFn: (doc: T | Omit<T, '_id'>) => TProjection;
}

type AddedCallback<T extends { _id: string }, TProjection> = (id: T['_id'], fields: TProjection) => void | Promise<void>;
type ChangedCallback<T extends { _id: string }, TProjection> = (id: T['_id'], fields: TProjection) => void | Promise<void>;
type RemovedCallback<T extends { _id: string }> = (id: T['_id']) => void | Promise<void>;
type AddedBeforeCallback<T extends { _id: string }, TProjection> = (
	id: T['_id'],
	fields: TProjection,
	before: T['_id'] | null,
) => void | Promise<void>;
type MovedBeforeCallback<T extends { _id: string }> = (id: T['_id'], before: T['_id'] | null) => void | Promise<void>;

/** @deprecated internal use only */
export interface IncompleteUnorderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends BaseQuery<T, TOptions, TProjection> {
	readonly comparator: null;
	readonly ordered: false;
	results?: IdMap<T['_id'], T>;
	resultsSnapshot?: IdMap<T['_id'], T> | null;
	added?: AddedCallback<T, TProjection>;
	changed?: ChangedCallback<T, TProjection>;
	removed?: RemovedCallback<T>;
}

/** @deprecated internal use only */
export interface UnorderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends IncompleteUnorderedQuery<T, TOptions, TProjection> {
	results: IdMap<T['_id'], T>;
	resultsSnapshot: IdMap<T['_id'], T> | null;
	readonly added: AddedCallback<T, TProjection>;
	readonly changed: ChangedCallback<T, TProjection>;
	readonly removed: RemovedCallback<T>;
}

/** @deprecated internal use only */
export interface IncompleteOrderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends BaseQuery<T, TOptions, TProjection> {
	readonly ordered: true;
	readonly comparator: ((a: T, b: T) => number) | null;
	results?: T[];
	resultsSnapshot?: T[] | null;
	added?: AddedCallback<T, TProjection>;
	changed?: ChangedCallback<T, TProjection>;
	removed?: RemovedCallback<T>;
	addedBefore?: AddedBeforeCallback<T, TProjection>;
	movedBefore?: MovedBeforeCallback<T>;
}

/** @deprecated internal use only */
export interface OrderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends IncompleteOrderedQuery<T, TOptions, TProjection> {
	results: T[];
	resultsSnapshot: T[] | null;
	readonly added: AddedCallback<T, TProjection>;
	readonly changed: ChangedCallback<T, TProjection>;
	readonly removed: RemovedCallback<T>;
	readonly addedBefore: AddedBeforeCallback<T, TProjection>;
	readonly movedBefore: MovedBeforeCallback<T>;
}

/** @deprecated internal use only */
export type IncompleteQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> =
	| IncompleteUnorderedQuery<T, TOptions, TProjection>
	| IncompleteOrderedQuery<T, TOptions, TProjection>;

/** @deprecated internal use only */
export type Query<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> =
	| UnorderedQuery<T, TOptions, TProjection>
	| OrderedQuery<T, TOptions, TProjection>;
