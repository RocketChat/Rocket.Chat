import type { EncryptedContent, IUpload } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult, ClientSession, Document, InsertOneResult, WithId, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IBaseUploadsModel<T extends IUpload> extends IBaseModel<T> {
	insertFileInit(userId: string, store: string, file: { name: string }, extra: object): Promise<InsertOneResult<WithId<IUpload>>>;

	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined;

	confirmTemporaryFile(fileId: string, userId: string): Promise<Document | UpdateResult> | undefined;

	findByIds<T_ extends Document = T, O extends FindOptionsWithProjection<T_> = FindOptionsWithProjection<T_>>(
		_ids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T_, O>>;

	findOneByName(name: string, options?: { session?: ClientSession }): Promise<T | null>;

	findOneByRoomId(rid: string): Promise<T | null>;

	findExpiredTemporaryFiles<T_ extends Document = T, O extends FindOptionsWithProjection<T_> = FindOptionsWithProjection<T_>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T_, O>>;

	updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult>;

	deleteFile(fileId: string, options?: { session?: ClientSession }): Promise<DeleteResult>;

	findOneByIdAndUserIdAndRoomId<T_ extends Document = T, O extends FindOptionsWithProjection<T_> = FindOptionsWithProjection<T_>>(
		fileId: string,
		userId: string,
		rid: string,
		options?: O,
	): Promise<DocumentWithProjection<T_, O> | null>;

	updateFileMetadata(
		fileId: string,
		userId: string,
		metadata: { name?: string; description?: string; typeGroup?: string; content?: EncryptedContent },
	): Promise<UpdateResult | null>;
}
