import type {
	IMediaCall,
	RocketChatRecordDeleted,
	MediaCallActorType,
	MediaCallSignedContact,
	MediaCallContact,
	IUser,
	MediaCallActor,
} from '@rocket.chat/core-typings';
import type { IMediaCallsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult, Document, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallsRaw extends BaseRaw<IMediaCall> implements IMediaCallsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCall>>) {
		super(db, 'media_calls', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { createdAt: 1 }, unique: false },
			{ key: { ended: 1, uids: 1, expiresAt: 1 }, unique: false },
			{
				key: { 'caller.type': 1, 'caller.id': 1, 'callerRequestedId': 1 },
				sparse: true,
			},
		];
	}

	public async findOneByIdAndCallee<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		id: IMediaCall['_id'],
		callee: MediaCallActor,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>(
			{
				'_id': id,
				'callee.type': callee.type,
				'callee.id': callee.id,
				...(callee.contractId && { 'callee.contractId': callee.contractId }),
			},
			options,
		);
	}

	public async findOneByCallerRequestedId<
		T extends Document = IMediaCall,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		id: Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>(
			{
				'caller.type': caller.type,
				'caller.id': caller.id,
				'callerRequestedId': id,
			},
			options,
		);
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCall> | Partial<IMediaCall>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: 'none',
			},
			{ $set: { state: 'ringing', expiresAt } },
		);
	}

	public async acceptCallById(
		callId: string,
		data: { calleeContractId: string; supportedFeatures: string[] },
		expiresAt: Date,
	): Promise<IMediaCall | null> {
		const { calleeContractId } = data;

		return this.findOneAndUpdate(
			{
				_id: callId,
				state: { $in: ['none', 'ringing'] },
			},
			{
				$set: {
					'state': 'accepted',
					'callee.contractId': calleeContractId,
					'acceptedAt': new Date(),
					expiresAt,
				},
				$pull: {
					features: {
						$nin: data.supportedFeatures,
					},
				},
			},
			{ returnDocument: 'after' },
		);
	}

	public async activateCallById(callId: string, expiresAt: Date): Promise<IMediaCall | null> {
		return this.findOneAndUpdate(
			{
				_id: callId,
				state: 'accepted',
			},
			{
				$set: {
					state: 'active',
					activatedAt: new Date(),
					expiresAt,
				},
			},
			{ returnDocument: 'after' },
		);
	}

	public async hangupCallById(callId: string, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<IMediaCall | null> {
		const { endedBy, reason } = params || {};

		return this.findOneAndUpdate(
			{
				_id: callId,
				ended: false,
			},
			{
				$set: {
					state: 'hangup',
					ended: true,
					endedAt: new Date(),
					...(endedBy && { endedBy }),
					...(reason && { hangupReason: reason }),
				},
			},
			{ returnDocument: 'after' },
		);
	}

	public async setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				ended: false,
			},
			{
				$set: { expiresAt },
			},
		);
	}

	public async transferCallById(callId: string, params: { by: MediaCallSignedContact; to: MediaCallContact }): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: {
					$in: ['accepted', 'active'],
				},
				transferredAt: {
					$exists: false,
				},
			},
			{
				$set: {
					transferredAt: new Date(),
					transferredBy: params.by,
					transferredTo: params.to,
				},
			},
		);
	}

	public findAllExpiredCalls<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>(
			{
				ended: false,
				expiresAt: {
					$lte: new Date(),
				},
			},
			options,
		);
	}

	public findAllNotOverByUid<T extends Document = IMediaCall, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		uid: IUser['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>(
			{
				ended: false,
				expiresAt: {
					$gt: new Date(),
				},
				uids: uid,
			},
			options,
		);
	}

	public async hasUnfinishedCalls(): Promise<boolean> {
		const count = await this.countDocuments({ ended: false }, { limit: 1 });
		return count > 0;
	}

	public async hasUnfinishedCallsByUid(uid: IUser['_id'], exceptCallId?: string): Promise<boolean> {
		const count = await this.countDocuments(
			{
				ended: false,
				uids: uid,
				...(exceptCallId && { _id: { $ne: exceptCallId } }),
			},
			{ limit: 1 },
		);
		return count > 0;
	}
}
