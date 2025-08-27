import type { IMediaCall, MediaCallActorType } from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	findOneByIdOrCallerRequestedId<T extends Document = IMediaCall>(
		id: IMediaCall['_id'] | Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null>;
	startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	acceptCallById(callId: string, calleeContractId: string, expiresAt: Date): Promise<UpdateResult>;
	activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<UpdateResult>;
	findAllExpiredCalls<T extends Document = IMediaCall>(options: FindOptions<T> | undefined): FindCursor<T>;
	hasUnfinishedCalls(): Promise<boolean>;
	setWebrtcOfferById(callId: string, offer: RTCSessionDescriptionInit, expiresAt: Date): Promise<UpdateResult>;
	setWebrtcAnswerById(callId: string, offer: RTCSessionDescriptionInit, expiresAt: Date): Promise<UpdateResult>;
}
