import type { IMediaCall, MediaCallActorType, MediaCallContact, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	findOneByCallerRequestedId<T extends Document = IMediaCall>(
		id: Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null>;
	startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	acceptCallById(callId: string, data: { calleeContractId: string }, expiresAt: Date): Promise<UpdateResult>;
	activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<UpdateResult>;
	transferCallById(callId: string, params: { by: MediaCallSignedActor; to: MediaCallContact }): Promise<UpdateResult>;
	findAllExpiredCalls<T extends Document = IMediaCall>(options: FindOptions<T> | undefined): FindCursor<T>;
	hasUnfinishedCalls(): Promise<boolean>;
}
