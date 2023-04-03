import type { FindOptions, DeleteResult, InsertOneResult, WithId, UpdateResult } from 'mongodb';
import type { IUserDataFile } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUserDataFilesModel extends IBaseModel<IUserDataFile> {
	findLastFileByUser(userId: string, options?: FindOptions<IUserDataFile>): Promise<IUserDataFile | null>;
	create(data: IUserDataFile): Promise<InsertOneResult<WithId<IUserDataFile>>>;

	deleteFile(fileId: string): Promise<DeleteResult>;

	updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult>;

	findOneByName(name: string): Promise<IUserDataFile | null>;

	findOneByRoomId(rid: string): Promise<IUserDataFile | null>;
}
