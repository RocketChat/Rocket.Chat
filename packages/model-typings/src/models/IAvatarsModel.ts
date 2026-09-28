import type { IAvatar, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IAvatarsModel extends IBaseUploadsModel<IAvatar> {
	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
	findOneByETag(eTag: string, options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
	findOneContactAvatar(userId: IUser['_id'], folderId: string, externalId: string, options?: FindOptions<IAvatar>): Promise<IAvatar | null>;
	findContactAvatars(
		userId: IUser['_id'],
		folderId: string,
		externalIds?: { in: string[] } | { notIn: string[] },
		options?: FindOptions<IAvatar>,
	): FindCursor<IAvatar>;
}
