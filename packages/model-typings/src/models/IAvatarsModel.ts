import type { IAvatar, IUser } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IAvatarsModel extends IBaseUploadsModel<IAvatar> {
	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
	findOneByETag(eTag: string, options?: FindOptions<IAvatarsModel>): Promise<IAvatar | null>;
}
