import type { IAvatar, IContact, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IAvatarsModel extends IBaseUploadsModel<IAvatar> {
	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
	findOneByETag(eTag: string, options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
	findOneContactAvatar(contactId: IContact['_id'], options?: FindOptions<IAvatar>): Promise<IAvatar | null>;
	findContactAvatars(contactIds: IContact['_id'][], options?: FindOptions<IAvatar>): FindCursor<IAvatar>;
}
