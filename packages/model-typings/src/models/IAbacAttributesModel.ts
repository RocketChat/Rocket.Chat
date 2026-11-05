import type { IAbacAttribute } from '@rocket.chat/core-typings';
import type { Document, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel.js';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection.js';

export interface IAbacAttributesModel extends IBaseModel<IAbacAttribute> {
	findOneByKey<T extends Document = IAbacAttribute, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		key: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findAll<T extends Document = IAbacAttribute, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countTotalValues(): Promise<number>;
	findAllKeys(): Promise<string[]>;
}
