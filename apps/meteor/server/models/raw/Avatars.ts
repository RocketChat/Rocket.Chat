import type { IAvatar, RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription, FindOptions } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class AvatarsRaw extends BaseUploadModelRaw implements IAvatarsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAvatar>>) {
		super(db, 'avatars', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [...super.modelIndexes(), { key: { userId: 1 }, sparse: true }];
	}

	findOneByUserId(userId: IUser['_id'], options?: FindOptions<IAvatar>) {
		return this.findOne({ userId }, options);
	}
}
