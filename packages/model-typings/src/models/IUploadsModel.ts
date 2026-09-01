import type { IRoom, IUpload } from '@rocket.chat/core-typings';
import type { FindCursor, WithId, Filter, FindOptions, UpdateResult, Document } from 'mongodb';

import type { FindPaginated } from './IBaseModel';
import type { IBaseUploadsModel } from './IBaseUploadsModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IUploadsModel extends IBaseUploadsModel<IUpload> {
	findPaginatedWithoutThumbs(query: Filter<IUpload>, options?: any): FindPaginated<FindCursor<WithId<IUpload>>>;

	findImagesByRoomId(
		rid: IRoom['_id'],
		uploadedAt?: Date,
		options?: Omit<FindOptions<IUpload>, 'sort'>,
	): FindPaginated<FindCursor<WithId<IUpload>>>;

	findByFederationMediaIdAndServerName(mediaId: string, serverName: string): Promise<IUpload | null>;

	setFederationInfo(fileId: IUpload['_id'], info: Required<IUpload>['federation']): Promise<UpdateResult>;

	setFederationRoomInfo(fileId: IUpload['_id'], rid: IRoom['_id'], mrid: string): Promise<UpdateResult>;

	findAllByOriginalFileId<T extends Document = IUpload, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		originalFileId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
}
