import type { IMediaCallChannel, MediaCallParticipantIdentification } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallChannelsModel extends IBaseModel<IMediaCallChannel> {
	findOneByCallIdAndParticipant(callId: string, participant: MediaCallParticipantIdentification): Promise<IMediaCallChannel | null>;
	setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult>;
}
