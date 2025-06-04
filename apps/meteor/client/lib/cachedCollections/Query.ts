import type { Cursor } from './Cursor';
import type { IdMap } from './IdMap';
import type { Matcher } from './Matcher';
import type { Options } from './MinimongoCollection';
import type { Sorter } from './Sorter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface BaseQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> {
	cursor: Cursor<T, TOptions, TProjection>;
	dirty: boolean;
	matcher: Matcher<T>;
	projectionFn: (doc: T | Omit<T, '_id'>) => TProjection;
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IncompleteUnorderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends BaseQuery<T, TOptions, TProjection> {
	sorter: null;
	ordered: false;
	results?: IdMap<T['_id'], T>;
	resultsSnapshot?: IdMap<T['_id'], T> | null;
	added?: AddedCallback<T, TProjection>;
	changed?: ChangedCallback<T, TProjection>;
	removed?: RemovedCallback<T>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface UnorderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends IncompleteUnorderedQuery<T, TOptions, TProjection> {
	results: IdMap<T['_id'], T>;
	resultsSnapshot: IdMap<T['_id'], T> | null;
	added: AddedCallback<T, TProjection>;
	changed: ChangedCallback<T, TProjection>;
	removed: RemovedCallback<T>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IncompleteOrderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends BaseQuery<T, TOptions, TProjection> {
	ordered: true;
	sorter: Sorter<T>;
	results?: T[];
	resultsSnapshot?: T[] | null;
	added?: AddedCallback<T, TProjection>;
	changed?: ChangedCallback<T, TProjection>;
	removed?: RemovedCallback<T>;
	addedBefore?: AddedBeforeCallback<T, TProjection>;
	movedBefore?: MovedBeforeCallback<T>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface OrderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any>
	extends IncompleteOrderedQuery<T, TOptions, TProjection> {
	results: T[];
	resultsSnapshot: T[] | null;
	added: AddedCallback<T, TProjection>;
	changed: ChangedCallback<T, TProjection>;
	removed: RemovedCallback<T>;
	addedBefore: AddedBeforeCallback<T, TProjection>;
	movedBefore: MovedBeforeCallback<T>;
}

export type Query<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> =
	| IncompleteUnorderedQuery<T, TOptions, TProjection>
	| UnorderedQuery<T, TOptions, TProjection>
	| IncompleteOrderedQuery<T, TOptions, TProjection>
	| OrderedQuery<T, TOptions, TProjection>;

export type CompleteQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>, TProjection extends T = any> =
	| UnorderedQuery<T, TOptions, TProjection>
	| OrderedQuery<T, TOptions, TProjection>;
