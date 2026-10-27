import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import type { FindCursor, InsertOneResult, UpdateResult, WithId, Document } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ICustomUserStatusModel extends IBaseModel<ICustomUserStatus> {
	findOneByName<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByNameExceptId<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		except: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByName<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNameExceptId<T extends Document = ICustomUserStatus, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		except: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	setName(_id: string, name: string): Promise<UpdateResult>;
	setStatusType(_id: string, statusType: string): Promise<UpdateResult>;
	create(data: InsertionModel<ICustomUserStatus>): Promise<InsertOneResult<WithId<ICustomUserStatus>>>;
}
