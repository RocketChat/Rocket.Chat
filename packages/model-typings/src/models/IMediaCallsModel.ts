import type {
	IMediaCall,
	IUser,
	MediaCallActor,
	MediaCallActorType,
	MediaCallContact,
	MediaCallSignedContact,
} from '@rocket.chat/core-typings';
import type { Document, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	findOneByIdAndCallee<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		id: IMediaCall['_id'],
		callee: MediaCallActor,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByCallerRequestedId<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		id: Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	acceptCallById(callId: string, data: { calleeContractId: string; supportedFeatures: string[] }, expiresAt: Date): Promise<UpdateResult>;
	activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<UpdateResult>;
	transferCallById(callId: string, params: { by: MediaCallSignedContact; to: MediaCallContact }): Promise<UpdateResult>;
	findAllExpiredCalls<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findAllNotOverByUid<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		uid: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	hasUnfinishedCalls(): Promise<boolean>;
	hasUnfinishedCallsByUid(uid: IUser['_id'], exceptCallId?: string): Promise<boolean>;
}
