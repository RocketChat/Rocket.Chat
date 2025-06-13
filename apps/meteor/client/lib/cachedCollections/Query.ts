/* eslint-disable @typescript-eslint/naming-convention */

import type { Cursor, Options } from './Cursor';
import type { IdMap } from './IdMap';
import type { OrderedObserver, UnorderedObserver } from './observers';

interface BaseQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>> {
	readonly cursor: Cursor<T, TOptions>;
	dirty: boolean;
	readonly predicate: (doc: T) => boolean;
	readonly projectionFn: (doc: T | Omit<T, '_id'>) => Partial<T>;
}

export interface UnorderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>>
	extends BaseQuery<T, TOptions>,
		UnorderedObserver<T> {
	readonly ordered: false;
	readonly comparator: null;
	results: IdMap<T['_id'], T>;
	resultsSnapshot: IdMap<T['_id'], T> | null;
}

export interface OrderedQuery<T extends { _id: string }, TOptions extends Options<T> = Options<T>>
	extends BaseQuery<T, TOptions>,
		OrderedObserver<T> {
	readonly ordered: true;
	readonly comparator: ((a: T, b: T) => number) | null;
	results: T[];
	resultsSnapshot: T[] | null;
}

export type Query<T extends { _id: string }, TOptions extends Options<T> = Options<T>> =
	| UnorderedQuery<T, TOptions>
	| OrderedQuery<T, TOptions>;
