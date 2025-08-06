import type { IMediaCall, RocketChatRecordDeleted, MediaCallActor } from '@rocket.chat/core-typings';
import type { IMediaCallsModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallsRaw extends BaseRaw<IMediaCall> implements IMediaCallsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCall>>) {
		super(db, 'media_calls', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { rid: 1, createdAt: 1 }, unique: false }];
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCall> | Partial<IMediaCall>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setEndedById(callId: string, data?: { endedBy?: MediaCallActor; endedAt?: Date }): Promise<void> {
		const { endedBy, endedAt } = { endedAt: new Date(), ...data };

		await this.updateOneById(callId, {
			$set: {
				...(endedBy && { endedBy }),
				endedAt,
			},
		});
	}

	public async startRingingById(callId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: 'none',
			},
			{ $set: { state: 'ringing' } },
		);
	}

	public async acceptCallById(callId: string, calleeContractId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				'_id': callId,
				'state': { $in: ['none', 'ringing'] },
				'callee.contractId': { $exists: false },
			},
			{ $set: { 'state': 'accepted', 'callee.contractId': calleeContractId } },
		);
	}

	public async hangupCallById(callId: string, params?: { endedBy?: MediaCallActor; reason?: string }): Promise<UpdateResult> {
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
}
