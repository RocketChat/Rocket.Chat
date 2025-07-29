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

	public async setStateById(callId: string, state: IMediaCall['state']): Promise<UpdateResult> {
		return this.updateOneById(callId, {
			$set: { state },
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

	public async acceptCallById(callId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				'_id': callId,
				'state': { $in: ['none', 'ringing'] },
				'caller.type': { $exists: true },
				'callee.type': { $exists: true },
				'$and': [
					{
						$or: [
							{
								'caller.type': 'user',
								'caller.sessionId': { $exists: true },
							},
							{
								'caller.type': {
									$ne: 'user',
								},
							},
						],
					},
					{
						$or: [
							{
								'callee.type': 'user',
								'callee.sessionId': { $exists: true },
							},
							{
								'callee.type': {
									$ne: 'user',
								},
							},
						],
					},
				],
			},
			{ $set: { state: 'accepted' } },
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

	public async setCallerSessionIdById(callId: string, callerSessionId: string): Promise<UpdateResult> {
		return this.updateOne({ '_id': callId, 'caller.sessionId': { $exists: false } }, { $set: { 'caller.sessionId': callerSessionId } });
	}

	public async setCalleeSessionIdById(callId: string, calleeSessionId: string): Promise<UpdateResult> {
		return this.updateOne({ '_id': callId, 'callee.sessionId': { $exists: false } }, { $set: { 'callee.sessionId': calleeSessionId } });
	}

	public async setActorSessionIdByIdAndRole(callId: string, sessionId: string, role: 'caller' | 'callee'): Promise<UpdateResult> {
		if (role === 'caller') {
			return this.setCallerSessionIdById(callId, sessionId);
		}

		return this.setCalleeSessionIdById(callId, sessionId);
	}

	public async getNewSequence(callId: string): Promise<IMediaCall | null> {
		return this.findOneAndUpdate({ _id: callId }, { $inc: { sequence: 1 } }, { returnDocument: 'after' });
	}
}
