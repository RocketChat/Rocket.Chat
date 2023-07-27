import type { IUpload } from '@rocket.chat/core-typings';
import type { FindCursor, WithId, Filter } from 'mongodb';

import type { FindPaginated } from './IBaseModel';
import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IUploadsModel extends IBaseUploadsModel<IUpload> {
	findNotHiddenFilesOfRoom(roomId: string, searchText: string, fileType: string, limit: number): FindCursor<IUpload>;

	findPaginatedWithoutThumbs(query: Filter<IUpload>, options?: any): FindPaginated<FindCursor<WithId<IUpload>>>;
}
