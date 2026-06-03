import type {
	IMediaCall,
	IUser,
	MediaCallActor,
	MediaCallActorType,
	MediaCallContact,
	MediaCallSignedContact,
} from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallsModel extends IBaseModel<IMediaCall> {
	findOneByIdAndCallee<T extends Document = IMediaCall>(
		id: IMediaCall['_id'],
		callee: MediaCallActor,
		options?: FindOptions<IMediaCall>,
	): Promise<T | null>;
	findOneByCallerRequestedId<T extends Document = IMediaCall>(
		id: Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null>;
	startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	acceptCallById(callId: string, data: { calleeContractId: string; supportedFeatures: string[] }, expiresAt: Date): Promise<UpdateResult>;
	activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult>;
	hangupCallById(callId: string, params: { endedBy?: IMediaCall['endedBy']; reason?: string } | undefined): Promise<UpdateResult>;
	transferCallById(callId: string, params: { by: MediaCallSignedContact; to: MediaCallContact }): Promise<UpdateResult>;
	findAllExpiredCalls<T extends Document = IMediaCall>(options: FindOptions<T> | undefined): FindCursor<T>;
	findAllNotOverByUid<T extends Document = IMediaCall>(uid: IUser['_id'], options?: FindOptions<T>): FindCursor<T>;
	hasUnfinishedCalls(): Promise<boolean>;
	hasUnfinishedCallsByUid(uid: IUser['_id'], exceptCallId?: string): Promise<boolean>;
	findActiveGroupCallInRoom<T extends Document = IMediaCall>(rid: string, options?: FindOptions<T>): Promise<T | null>;
	findActiveGroupCalls<T extends Document = IMediaCall>(options?: FindOptions<T>): FindCursor<T>;
	findOneByRecordingEgressId<T extends Document = IMediaCall>(egressId: string, options?: FindOptions<T>): Promise<T | null>;
	addGroupParticipant(
		callId: string,
		participant: { type: string; id: string; contractId?: string; displayName?: string; username?: string },
	): Promise<UpdateResult>;
	markGroupParticipantLeft(callId: string, userId: IUser['_id']): Promise<UpdateResult>;
	setTranscriptionEnabled(callId: string, enabled: boolean, byUserId?: string): Promise<UpdateResult>;
	appendTranscriptEntry(
		callId: string,
		entry: { participantId: string; text: string; startedAt: Date; endedAt: Date },
	): Promise<UpdateResult>;
	setSummaryById(callId: string, summary: { generatedAt: Date; messageId?: string }): Promise<UpdateResult>;
	findEndedCallsAwaitingSummary(): Promise<IMediaCall[]>;
}
