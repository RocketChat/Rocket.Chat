import type { FindOptions, InsertOneResult, WithId } from 'mongodb';
import type { IUserDataFile } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUserDataFilesModel extends IBaseModel<IUserDataFile> {
	findLastFileByUser(userId: string, options?: FindOptions<IUserDataFile>): Promise<IUserDataFile | null>;
	create(data: IUserDataFile): Promise<InsertOneResult<WithId<IUserDataFile>>>;
}
