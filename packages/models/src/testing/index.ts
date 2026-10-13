import type { FindCursor } from 'mongodb';

export const fakeCursor = <T>(docs: T[]): FindCursor<T> =>
	({
		toArray: async () => [...docs],
		map: <U>(transform: (doc: T) => U) => fakeCursor(docs.map(transform)),
		async *[Symbol.asyncIterator]() {
			yield* docs;
		},
	}) as unknown as FindCursor<T>;
