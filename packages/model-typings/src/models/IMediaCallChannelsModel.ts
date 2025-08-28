import type { IMediaCallChannel, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { Document, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IMediaCallChannelsModel extends IBaseModel<IMediaCallChannel> {
	createOrUpdateChannel(channel: InsertionModel<IMediaCallChannel>): Promise<IMediaCallChannel | null>;
	findOneByCallIdAndSignedActor<T extends Document = IMediaCallChannel>(
		params: MediaCallSignedActor & { callId: string },
		options?: FindOptions<T>,
	): Promise<T | null>;
	setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult>;
	setActiveById(_id: string): Promise<UpdateResult>;
}
