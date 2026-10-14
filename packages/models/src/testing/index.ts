import type { FindCursor } from 'mongodb';

export const fakeCursor = <T>(docs: T[]): FindCursor<T> =>
	({
		toArray: async () => [...docs],
		forEach: async (iterator: (doc: T) => boolean | void) => {
			for (const doc of docs) {
				if (iterator(doc) === false) {
					break;
				}
			}
		},
		map: <U>(transform: (doc: T) => U) => fakeCursor(docs.map(transform)),
		async *[Symbol.asyncIterator]() {
			yield* docs;
		},
	}) as unknown as FindCursor<T>;
