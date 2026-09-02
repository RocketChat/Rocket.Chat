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
	/**
	 * The three state transitions below return the call as it is once the transition has been
	 * applied, or `null` when the call was no longer in a state the transition applies to. Whoever
	 * reports the transition must describe the call as it was when it happened, and a separate read
	 * would already see the next transition.
	 */
	acceptCallById(
		callId: string,
		data: { calleeContractId: string; supportedFeatures: string[] },
		expiresAt: Date,
	): Promise<IMediaCall | null>;
	activateCallById(callId: string, expiresAt: Date): Promise<IMediaCall | null>;
	setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<IMediaCall | null>;
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
