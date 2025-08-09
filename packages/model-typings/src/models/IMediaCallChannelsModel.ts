import type { IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IMediaCallChannelsModel extends IBaseModel<IMediaCallChannel> {
	createOrUpdateChannel(channel: InsertionModel<IMediaCallChannel>): Promise<IMediaCallChannel | null>;
	findOneByCallIdAndActor(callId: string, actor: Required<MediaCallActor>): Promise<IMediaCallChannel | null>;
	setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult>;
	setActiveById(_id: string): Promise<UpdateResult>;
	setLocalDescription(_id: string, localDescription: RTCSessionDescriptionInit): Promise<UpdateResult>;
}
