import type { IMediaCall, MediaCallParticipant, MediaCallUserChannel, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMediaCallsModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallsRaw extends BaseRaw<IMediaCall> implements IMediaCallsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCall>>) {
		super(db, 'media_calls', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { rid: 1, createdAt: 1 }, unique: false },
			// unique key to prevent the same sessionId from getting two channels due to race conditions
			{ key: { '_id': 1, 'userChannels.uid': 1, 'userChannels.sessionId': 1 }, unique: true },
		];
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCall> | Partial<IMediaCall>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setEndedById(callId: string, data?: { endedBy?: MediaCallParticipant; endedAt?: Date }): Promise<void> {
		const { endedBy, endedAt } = { endedAt: new Date(), ...data };

		await this.updateOneById(callId, {
			$set: {
				...(endedBy && { endedBy }),
				endedAt,
			},
		});
	}

	public async addUserChannel(callId: string, userChannel: MediaCallUserChannel): Promise<void> {
		await this.updateOneById(callId, {
			$addToSet: {
				userChannels: userChannel,
			},
		});
	}
}
