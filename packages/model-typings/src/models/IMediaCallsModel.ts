import type { IMediaCall, MediaCallActorType } from '@rocket.chat/core-typings';
import type { Document, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	findOneByIdOrCallerRequestedId<T extends Document = IMediaCall>(
		id: IMediaCall['_id'] | Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null>;
	startRingingById(callId: string): Promise<UpdateResult>;
	acceptCallById(callId: string, calleeContractId: string): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<UpdateResult>;
	hangupEveryCall(params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<UpdateResult>;
}
