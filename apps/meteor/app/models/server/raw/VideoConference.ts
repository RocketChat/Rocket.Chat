import type { Cursor, UpdateOneOptions, UpdateQuery, UpdateWriteOpResult } from 'mongodb';
import type { VideoConference, IGroupVideoConference, ILivechatVideoConference, IUser, IRoom } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import type { IndexSpecification, InsertionModel } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<VideoConference> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { rid: 1, status: 1, createdAt: 1 }, unique: false }];
	}

	public async findRecentByRoomId(
		rid: IRoom['_id'],
		{ offset, count }: { offset?: number; count?: number } = {},
	): Promise<Cursor<VideoConference>> {
		return this.find(
			{
				rid,
				createdAt: {
					$gte: new Date(new Date().valueOf() - 24 * 60 * 60 * 1000),
				},
			},
			{
				sort: { status: 1, createdAt: -1 },
				skip: offset,
				limit: count,
				projection: {
					providerData: 0,
				},
			},
		);
	}

	public async createDirect(callDetails: Pick<VideoConference, 'rid' | 'createdBy' | 'providerName'>): Promise<string> {
		const call: InsertionModel<VideoConference> = {
			type: 'direct',
			users: [],
			messages: {},
			status: VideoConferenceStatus.CALLING,
			createdAt: new Date(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createGroup(
		callDetails: Required<Pick<IGroupVideoConference, 'rid' | 'title' | 'createdBy' | 'providerName'>>,
	): Promise<string> {
		const call: InsertionModel<IGroupVideoConference> = {
			type: 'videoconference',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			anonymousUsers: 0,
			createdAt: new Date(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createLivechat(
		callDetails: Required<Pick<ILivechatVideoConference, 'rid' | 'createdBy' | 'providerName'>>,
	): Promise<string> {
		const call: InsertionModel<ILivechatVideoConference> = {
			type: 'livechat',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			createdAt: new Date(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public updateOneById(
		_id: string,
		update: UpdateQuery<VideoConference> | Partial<VideoConference>,
		options?: UpdateOneOptions,
	): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setEndedById(callId: string, endedBy?: { _id: string; name: string; username: string }, endedAt?: Date): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				endedBy,
				endedAt: endedAt || new Date(),
			},
		});
	}

	public async setStatusById(callId: string, status: VideoConference['status']): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				status,
			},
		});
	}

	public async setUrlById(callId: string, url: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				url,
			},
		});
	}

	public async setProviderDataById(callId: string, providerData: Record<string, any> | undefined): Promise<void> {
		await this.updateOneById(callId, {
			...(providerData
				? {
						$set: {
							providerData,
						},
				  }
				: {
						$unset: {
							providerData: 1,
						},
				  }),
		});
	}

	public async addUserById(callId: string, user: Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'> & { ts?: Date }): Promise<void> {
		await this.updateOneById(callId, {
			$addToSet: {
				users: {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					ts: user.ts || new Date(),
				},
			},
		});
	}

	public async setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				[`messages.${messageType}`]: messageId,
			},
		});
	}
}
