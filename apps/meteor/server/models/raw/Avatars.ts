import type { IAvatar, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class AvatarsRaw extends BaseUploadModelRaw implements IAvatarsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAvatar>>) {
		super(db, 'avatars', trash);
	}
}
