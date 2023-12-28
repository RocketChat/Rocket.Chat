import type { IUpload } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult, Document, InsertOneResult, WithId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IBaseUploadsModel<T extends IUpload> extends IBaseModel<T> {
	insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneResult<WithId<IUpload>>>;

	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined;

	findOneByName(name: string): Promise<T | null>;

	findOneByRoomId(rid: string): Promise<T | null>;

	updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult>;

	deleteFile(fileId: string): Promise<DeleteResult>;
}
