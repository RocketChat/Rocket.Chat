import type { IBaseModel } from '@rocket.chat/model-typings';
import type { FindCursor } from 'mongodb';

import type * as models from '../index';
import { registerModel } from '../proxify';

type Models = typeof models;

export type ModelName = { [K in keyof Models]: Models[K] extends IBaseModel<any, any, any> ? K : never }[keyof Models];

export const mockModel = <K extends ModelName>(name: K, double: Partial<Record<keyof Models[K], unknown>>): void =>
	registerModel(`I${name}Model`, double as unknown as IBaseModel<any>);

export const fakeCursor = <T>(docs: T[]): FindCursor<T> =>
	({
		toArray: async () => [...docs],
		map: <U>(transform: (doc: T) => U) => fakeCursor(docs.map(transform)),
		async *[Symbol.asyncIterator]() {
			yield* docs;
		},
	}) as unknown as FindCursor<T>;
