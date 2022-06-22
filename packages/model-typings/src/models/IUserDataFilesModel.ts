import type { FindOneOptions, InsertOneWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import type { IUserDataFile } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUserDataFilesModel extends IBaseModel<IUserDataFile> {
	findLastFileByUser(userId: string, options?: WithoutProjection<FindOneOptions<IUserDataFile>>): Promise<IUserDataFile | null>;
	create(data: IUserDataFile): Promise<InsertOneWriteOpResult<WithId<IUserDataFile>>>;
}
