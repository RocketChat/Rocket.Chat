import type { IAvatar, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IAvatarsModel } from '@rocket.chat/model-typings';
import type { Collection } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class AvatarsRaw extends BaseUploadModelRaw implements IAvatarsModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<IAvatar>>) {
		super('avatars', trash);
	}
}
