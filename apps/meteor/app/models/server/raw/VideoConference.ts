import type { UpdateOneOptions, UpdateQuery, UpdateWriteOpResult } from 'mongodb';
import type { IVideoConference, IUser, IRoom } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import type { IndexSpecification, InsertionModel } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<IVideoConference> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1, status: 1, createdAt: 1 }, unique: false }];
	}

	public async createDirect(rid: IRoom['_id'], createdBy: Pick<IUser, '_id' | 'name' | 'username'>): Promise<string> {
		const call: InsertionModel<IVideoConference> = {
			type: 'direct',
			rid,
			users: [],
			messages: {},
			status: VideoConferenceStatus.CALLING,
			createdBy,
			createdAt: new Date(),
		};

		return (await this.insertOne(call)).insertedId;
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

	public setUrlById(callId: string, url: string): void {
		this.updateOneById(callId, {
			$set: {
				url,
			},
		});
	}

	public addUserById(callId: string, user: Pick<IUser, '_id' | 'name' | 'username'>): void {
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

	public setMessageById(callId: string, messageType: keyof IVideoConference['messages'], messageId: string): void {
		this.updateOneById(callId, {
			$set: {
				[`messages.${messageType}`]: messageId,
			},
		});
	}
}
