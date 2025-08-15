import type { IMediaCall, RocketChatRecordDeleted, MediaCallActorType } from '@rocket.chat/core-typings';
import type { IMediaCallsModel } from '@rocket.chat/model-typings';
import type {
	IndexDescription,
	Collection,
	Db,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	FindOptions,
	Document,
	FindCursor,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallsRaw extends BaseRaw<IMediaCall> implements IMediaCallsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCall>>) {
		super(db, 'media_calls', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { createdAt: 1 }, unique: false },
			{ key: { state: 1, expiresAt: 1 }, unique: false },
			{
				key: { 'caller.type': 1, 'caller.id': 1, 'callerRequestedId': 1 },
				sparse: true,
			},
		];
	}

	public async findOneByIdOrCallerRequestedId<T extends Document = IMediaCall>(
		id: IMediaCall['_id'] | Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null> {
		return this.findOne(
			{
				$or: [
					// If we get an id, find any call with that id
					{ _id: id },
					// if we get a callerRequestedId, then only find it if it was created by the same actor
					{ 'caller.type': caller.type, 'caller.id': caller.id, 'callerRequestedId': id },
				],
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

	public async acceptCallById(callId: string, calleeContractId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				'_id': callId,
				'state': { $in: ['none', 'ringing'] },
				'callee.contractId': { $exists: false },
			},
			{ $set: { 'state': 'accepted', 'callee.contractId': calleeContractId, expiresAt } },
		);
	}

	public async activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: 'accepted',
			},
			{
				$set: {
					state: 'active',
					expiresAt,
				},
			},
		);
	}

	public async hangupCallById(callId: string, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<UpdateResult> {
		const { endedBy, reason } = params || {};

		return this.updateOne(
			{
				_id: callId,
				state: { $ne: 'hangup' },
			},
			{
				$set: {
					state: 'hangup',
					endedAt: new Date(),
					...(endedBy && { endedBy }),
					...(reason && { hangupReason: reason }),
				},
			},
		);
	}

	public async setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: { $ne: 'hangup' },
			},
			{
				$set: { expiresAt },
			},
		);
	}

	public findAllExpiredCalls<T extends Document = IMediaCall>(options?: FindOptions<T>): FindCursor<T> {
		return this.find(
			{
				state: {
					$ne: 'hangup',
				},
				expiresAt: {
					$lt: new Date(),
				},
			},
			options,
		);
	}

	public async hasUnfinishedCalls(): Promise<boolean> {
		const count = await this.countDocuments({ state: { $ne: 'hangup' } }, { limit: 1 });
		return count > 0;
	}
}
