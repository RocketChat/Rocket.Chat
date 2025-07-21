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

	public async acceptCallById(callId: string, calleeSessionId?: string): Promise<UpdateResult> {
		if (!calleeSessionId) {
			return this.updateOne({ _id: callId, state: { $in: ['none', 'ringing'] } }, { $set: { state: 'accepted' } });
		}

		return this.updateOne(
			{
				_id: callId,
				$or: [
					{
						state: { $in: ['none', 'ringing'] },
					},
					{
						'state': 'accepted',
						'callee.sessionId': { $exists: false },
					},
				],
			},
			{ $set: { 'state': 'accepted', 'callee.sessionId': calleeSessionId } },
		);
	}

	public async setCallerSessionIdById(callId: string, callerSessionId: string): Promise<UpdateResult> {
		return this.updateOne({ '_id': callId, 'caller.sessionId': { $exists: false } }, { $set: { 'caller.sessionId': callerSessionId } });
	}

	public async getNewSequence(callId: string): Promise<IMediaCall | null> {
		return this.findOneAndUpdate({ _id: callId }, { $inc: { sequence: 1 } });
	}
}
