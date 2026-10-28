import type { ICustomSound } from '@rocket.chat/core-typings';
import type { FindCursor, InsertOneResult, UpdateResult, WithId, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ICustomSoundsModel extends IBaseModel<ICustomSound> {
	findByName<T extends Document = ICustomSound, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		exceptId?: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findOneByName<T extends Document = ICustomSound, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		exceptId?: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	create(data: Omit<ICustomSound, '_id' | '_updatedAt'>): Promise<InsertOneResult<WithId<ICustomSound>>>;
	updateById(_id: string, data: Partial<Omit<ICustomSound, '_id'>>): Promise<UpdateResult>;
}
