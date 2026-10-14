import type { FindCursor } from 'mongodb';

export const fakeCursor = <T>(docs: T[]): FindCursor<T> => {
	let read = (): unknown[] => [...docs];

	const cursor = {
		toArray: async () => read(),
		forEach: async (iterator: (doc: unknown) => boolean | void) => {
			for (const doc of read()) {
				if (iterator(doc) === false) {
					break;
				}
			}
		},
		map: (transform: (doc: unknown) => unknown) => {
			const previous = read;
			read = () => previous().map(transform);
			return cursor;
		},
		async *[Symbol.asyncIterator]() {
			yield* read();
		},
	};

	return cursor as unknown as FindCursor<T>;
};
