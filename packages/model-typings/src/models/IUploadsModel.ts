import type {
	CollectionInsertOneOptions,
	Cursor,
	DeleteWriteOpResultObject,
	FilterQuery,
	InsertOneWriteOpResult,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	WithId,
	WriteOpResult,
} from 'mongodb';
import type { IUpload } from '@rocket.chat/core-typings';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IUploadsModel extends IBaseModel<IUpload> {
	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): Cursor<IUpload>;

	insert(fileData: InsertionModel<IUpload>, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<WithId<IUpload>>>;

	update(
		filter: FilterQuery<IUpload>,
		update: UpdateQuery<IUpload> | Partial<IUpload>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<WriteOpResult>;

	insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneWriteOpResult<WithId<IUpload>>>;

	updateFileComplete(fileId: string, userId: string, file: object): Promise<UpdateWriteOpResult | undefined>;

	deleteFile(fileId: string): Promise<DeleteWriteOpResultObject>;
}
