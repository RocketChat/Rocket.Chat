import type { FindCursor, FindOptions, InsertOneResult, UpdateResult, WithId } from 'mongodb';
import type { ICustomUserStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ICustomUserStatusModel extends IBaseModel<ICustomUserStatus> {
	findOneByName(name: string, options?: undefined): Promise<ICustomUserStatus | null>;
	findOneByName(name: string, options?: FindOptions<ICustomUserStatus>): Promise<ICustomUserStatus | null>;
	findByName(name: string, options: FindOptions<ICustomUserStatus>): FindCursor<ICustomUserStatus>;
	findByNameExceptId(name: string, except: string, options: FindOptions<ICustomUserStatus>): FindCursor<ICustomUserStatus>;
	setName(_id: string, name: string): Promise<UpdateResult>;
	setStatusType(_id: string, statusType: string): Promise<UpdateResult>;
	create(data: ICustomUserStatus): Promise<InsertOneResult<WithId<ICustomUserStatus>>>;
}
