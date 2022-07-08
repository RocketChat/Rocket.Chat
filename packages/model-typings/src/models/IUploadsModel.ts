import type { FindCursor, DeleteResult, InsertOneResult, UpdateResult, WithId } from 'mongodb';
import type { IUpload } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUploadsModel extends IBaseModel<IUpload> {
	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): FindCursor<IUpload>;

	insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneResult<WithId<IUpload>>>;

	updateFileComplete(fileId: string, userId: string, file: object): Promise<UpdateResult | undefined>;

	deleteFile(fileId: string): Promise<DeleteResult>;
}
