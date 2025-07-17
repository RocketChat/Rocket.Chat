import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	setEndedById(callId: string, data?: { endedBy?: MediaCallActor; endedAt?: Date }): Promise<void>;
	setStateById(callId: string, state: IMediaCall['state']): Promise<UpdateResult>;
	startRingingById(callId: string): Promise<UpdateResult>;
}
