import type { IBaseModel } from '@rocket.chat/model-typings';
import type { FindCursor } from 'mongodb';

import type * as models from '../index';
import { registerModel } from '../proxify';

type Models = typeof models;

export type ModelName = { [K in keyof Models]: Models[K] extends IBaseModel<any, any, any> ? K : never }[keyof Models];

export const mockModel = <K extends ModelName>(name: K, double: Partial<Record<keyof Models[K], unknown>>): void =>
	registerModel(`I${name}Model`, double as unknown as IBaseModel<any>);

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
