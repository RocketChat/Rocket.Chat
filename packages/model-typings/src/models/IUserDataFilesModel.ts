import type { IUserDataFile } from '@rocket.chat/core-typings';
import type { FindOptions, InsertOneResult, WithId } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IUserDataFilesModel extends IBaseUploadsModel<IUserDataFile> {
	findLastFileByUser(userId: string, options?: FindOptions<IUserDataFile>): Promise<IUserDataFile | null>;
	create(data: IUserDataFile): Promise<InsertOneResult<WithId<IUserDataFile>>>;
}
