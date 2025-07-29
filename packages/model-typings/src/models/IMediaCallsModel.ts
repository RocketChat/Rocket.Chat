import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	setEndedById(callId: string, data?: { endedBy?: MediaCallActor; endedAt?: Date }): Promise<void>;
	setStateById(callId: string, state: IMediaCall['state']): Promise<UpdateResult>;
	startRingingById(callId: string): Promise<UpdateResult>;
	getNewSequence(callId: string): Promise<IMediaCall | null>;
	acceptCallById(callId: string): Promise<UpdateResult>;
	setCallerSessionIdById(callId: string, callerSessionId: string): Promise<UpdateResult>;
	setCalleeSessionIdById(callId: string, calleeSessionId: string): Promise<UpdateResult>;
	setActorSessionIdByIdAndRole(callId: string, sessionId: string, role: 'caller' | 'callee'): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: MediaCallActor; reason?: string } | undefined): Promise<UpdateResult>;
}
