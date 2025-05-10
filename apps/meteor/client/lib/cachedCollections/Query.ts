import type { Cursor } from './Cursor';
import type { IdMap } from './IdMap';
import type { Matcher } from './Matcher';
import type { Options } from './MinimongoCollection';
import type { Sorter } from './Sorter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface BaseQuery<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T> {
	cursor: Cursor<T, TOptions, TProjection>;
	dirty: boolean;
	matcher: Matcher<T>;
	projectionFn: (doc: T | Omit<T, '_id'>) => TProjection;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IncompleteUnorderedQuery<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T>
	extends BaseQuery<T, TOptions, TProjection> {
	sorter: null;
	ordered: false;
	results?: IdMap<T['_id'], T>;
	resultsSnapshot?: IdMap<T['_id'], T> | null;
	added?: (id: T['_id'], fields: TProjection) => void;
	changed?: (id: T['_id'], fields: TProjection) => void;
	removed?: (id: T['_id']) => void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface UnorderedQuery<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T>
	extends IncompleteUnorderedQuery<T, TOptions, TProjection> {
	results: IdMap<T['_id'], T>;
	resultsSnapshot: IdMap<T['_id'], T> | null;
	added: (id: T['_id'], fields: TProjection) => void;
	changed: (id: T['_id'], fields: TProjection) => void;
	removed: (id: T['_id']) => void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IncompleteOrderedQuery<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T>
	extends BaseQuery<T, TOptions, TProjection> {
	ordered: true;
	sorter: Sorter<T>;
	results?: T[];
	resultsSnapshot?: T[] | null;
	added?: (id: T['_id'], fields: TProjection) => void;
	changed?: (id: T['_id'], fields: TProjection) => void;
	removed?: (id: T['_id']) => void;
	addedBefore?: (id: T['_id'], fields: TProjection, before: T['_id'] | null) => void;
	movedBefore?: (id: T['_id'], before: T['_id'] | null) => void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface OrderedQuery<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T>
	extends IncompleteOrderedQuery<T, TOptions, TProjection> {
	results: T[];
	resultsSnapshot: T[] | null;
	added: (id: T['_id'], fields: TProjection) => void;
	changed: (id: T['_id'], fields: TProjection) => void;
	removed: (id: T['_id']) => void;
	addedBefore: (id: T['_id'], fields: TProjection, before: T['_id'] | null) => void;
	movedBefore: (id: T['_id'], before: T['_id'] | null) => void;
}

export type Query<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T> =
	| IncompleteUnorderedQuery<T, TOptions, TProjection>
	| UnorderedQuery<T, TOptions, TProjection>
	| IncompleteOrderedQuery<T, TOptions, TProjection>
	| OrderedQuery<T, TOptions, TProjection>;
