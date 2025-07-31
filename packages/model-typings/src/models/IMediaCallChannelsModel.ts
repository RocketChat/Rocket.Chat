import type { IMediaCallChannel, MediaCallParticipantIdentification } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IMediaCallChannelsModel extends IBaseModel<IMediaCallChannel> {
	createOrUpdateChannel(channel: InsertionModel<IMediaCallChannel>): Promise<IMediaCallChannel | null>;
	findOneByCallIdAndParticipant(callId: string, participant: MediaCallParticipantIdentification): Promise<IMediaCallChannel | null>;
	setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult>;
	setLocalDescription(_id: string, localDescription: RTCSessionDescriptionInit): Promise<UpdateResult>;
}
