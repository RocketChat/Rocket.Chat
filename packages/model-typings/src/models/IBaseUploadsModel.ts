import type { IUpload } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult, ClientSession, Document, InsertOneResult, WithId, FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IBaseUploadsModel<T extends IUpload> extends IBaseModel<T> {
	insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneResult<WithId<IUpload>>>;

	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined;

	confirmTemporaryFile(fileId: string, userId: string): Promise<Document | UpdateResult> | undefined;

	findOneByName(name: string, options?: { session?: ClientSession }): Promise<T | null>;

	findOneByRoomId(rid: string): Promise<T | null>;

	findExpiredTemporaryFiles(options?: FindOptions<T>): FindCursor<T>;

	updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult>;

	deleteFile(fileId: string, options?: { session?: ClientSession }): Promise<DeleteResult>;
}
