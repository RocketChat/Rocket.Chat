import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	setEndedById(callId: string, data?: { endedBy?: MediaCallActor; endedAt?: Date }): Promise<void>;
	startRingingById(callId: string): Promise<UpdateResult>;
	acceptCallById(callId: string, calleeContractId: string): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: MediaCallActor; reason?: string } | undefined): Promise<UpdateResult>;
}
