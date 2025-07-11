import type { IMediaCall, MediaCallParticipant } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	setEndedById(callId: string, data?: { endedBy?: MediaCallParticipant; endedAt?: Date }): Promise<void>;
}
