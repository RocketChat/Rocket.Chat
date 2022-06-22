import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import type { ICustomUserStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ICustomUserStatusModel extends IBaseModel<ICustomUserStatus> {
	findOneByName(name: string, options?: undefined): Promise<ICustomUserStatus | null>;
	findOneByName(name: string, options?: WithoutProjection<FindOneOptions<ICustomUserStatus>>): Promise<ICustomUserStatus | null>;
	findByName(name: string, options: WithoutProjection<FindOneOptions<ICustomUserStatus>>): Cursor<ICustomUserStatus>;
	findByNameExceptId(
		name: string,
		except: string,
		options: WithoutProjection<FindOneOptions<ICustomUserStatus>>,
	): Cursor<ICustomUserStatus>;
	setName(_id: string, name: string): Promise<UpdateWriteOpResult>;
	setStatusType(_id: string, statusType: string): Promise<UpdateWriteOpResult>;
	create(data: ICustomUserStatus): Promise<InsertOneWriteOpResult<WithId<ICustomUserStatus>>>;
}
