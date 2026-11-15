import type { IAbacAttribute } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IAbacAttributesModel extends IBaseModel<IAbacAttribute> {
	findOneByKey<T extends Document = IAbacAttribute, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		key: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	countTotalValues(): Promise<number>;
}
