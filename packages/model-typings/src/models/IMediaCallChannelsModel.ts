import type { IMediaCallChannel, MediaCallParticipantIdentification, MediaCallChannelWebRTCSession } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallChannelsModel extends IBaseModel<IMediaCallChannel> {
	findOneByCallIdAndParticipant(callId: string, participant: MediaCallParticipantIdentification): Promise<IMediaCallChannel | null>;
	setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult>;
	setLocalWebRTCSession(_id: string, session: MediaCallChannelWebRTCSession): Promise<UpdateResult>;
	setRemoteWebRTCSession(_id: string, session: MediaCallChannelWebRTCSession): Promise<UpdateResult>;
}
