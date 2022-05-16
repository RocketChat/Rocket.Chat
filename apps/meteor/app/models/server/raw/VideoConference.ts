import { IVideoConference, IUser } from '@rocket.chat/core-typings';
import { UpdateOneOptions, UpdateQuery, UpdateWriteOpResult } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<IVideoConference> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1, status: 1, createdAt: 1 }, unique: false }];
	}

	public updateOneById(
		_id: string,
		update: UpdateQuery<IVideoConference> | Partial<IVideoConference>,
		options?: UpdateOneOptions,
	): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, update, options);
	}

	public endVideoConference(callId: string, endedBy: { _id: string; name: string; username: string }): void {
		this.updateOneById(callId, {
			$set: {
				endedBy,
				endedAt: new Date(),
			},
		});
	}

	public updateUrl(callId: string, url: string): void {
		this.updateOneById(callId, {
			$set: {
				url,
			},
		});
	}

	public addUserToVideoConference(callId: string, user: Pick<IUser, '_id' | 'name' | 'username'>): void {
		this.updateOneById(callId, {
			$addToSet: {
				users: {
					_id: user._id,
					username: user.username,
					name: user.name,
					ts: new Date(),
				},
			},
		});
	}
}
