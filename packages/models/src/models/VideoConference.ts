import type {
	VideoConference,
	IGroupVideoConference,
	ILivechatVideoConference,
	IUser,
	IRoom,
	RocketChatRecordDeleted,
	IVoIPVideoConference,
	VideoConferenceWithDiscussion,
} from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import type { FindPaginated, InsertionModel, IVideoConferenceModel } from '@rocket.chat/model-typings';
import type {
	AggregationCursor,
	FindCursor,
	UpdateOptions,
	UpdateFilter,
	UpdateResult,
	IndexDescription,
	Collection,
	Db,
	CountDocumentsOptions,
	FindOptions,
	WithId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class VideoConferenceRaw extends BaseRaw<VideoConference> implements IVideoConferenceModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<VideoConference>>) {
		super(db, 'video_conference', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { rid: 1, createdAt: 1 }, unique: false },
			{ key: { type: 1, status: 1 }, unique: false },
			{ key: { discussionRid: 1 }, unique: false },
			{ key: { mediaCallIds: 1 }, unique: true, sparse: true },
			{ key: { providerName: 1, sipAlias: 1 }, unique: true, partialFilterExpression: { sipAlias: { $exists: true } } },
		];
	}

	public findPaginatedByRoomId(
		rid: IRoom['_id'],
		{ offset, count }: { offset?: number; count?: number } = {},
	): FindPaginated<AggregationCursor<VideoConferenceWithDiscussion>> {
		// Match conferences started in this room (`rid`) and those whose discussion is this room
		// (`discussionRid`), so a discussion room resolves the conference it belongs to — its members
		// may not have access to the parent room the conference originated in.
		const matchFilter = { $or: [{ rid }, { discussionRid: rid }] };
		const pipeline: object[] = [
			{ $match: matchFilter },
			{ $sort: { createdAt: -1 } },
			...(offset ? [{ $skip: offset }] : []),
			...(count ? [{ $limit: count }] : []),
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'discussionRid',
					foreignField: '_id',
					as: 'discussionRoom',
					pipeline: [{ $project: { fname: 1, name: 1, lastMessage: 1 } }],
				},
			},
			{
				$addFields: {
					discussionTitle: {
						$ifNull: [{ $first: '$discussionRoom.fname' }, { $first: '$discussionRoom.name' }],
					},
					discussionLastMessage: { $first: '$discussionRoom.lastMessage' },
				},
			},
			{ $project: { providerData: 0, discussionRoom: 0 } },
		];

		return {
			cursor: this.col.aggregate<VideoConferenceWithDiscussion>(pipeline),
			totalCount: this.col.countDocuments(matchFilter),
		};
	}

	public async findAllLongRunning(minDate: Date): Promise<FindCursor<Pick<VideoConference, '_id'>>> {
		return this.find(
			{
				createdAt: {
					$lte: minDate,
				},
				endedAt: {
					$exists: false,
				},
			},
			{
				projection: {
					_id: 1,
				},
			},
		);
	}

	public async countByTypeAndStatus(
		type: VideoConference['type'],
		status: VideoConferenceStatus,
		options: CountDocumentsOptions,
	): Promise<number> {
		return this.countDocuments(
			{
				type,
				status,
			},
			options,
		);
	}

	public async createDirect({
		providerName,
		...callDetails
	}: Pick<VideoConference, 'rid' | 'createdBy' | 'providerName'>): Promise<string> {
		const call: InsertionModel<VideoConference> = {
			type: 'direct',
			users: [],
			messages: {},
			status: VideoConferenceStatus.CALLING,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			ringing: true,
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createGroup({
		providerName,
		mediaCallIds,
		sipAlias,
		discussionRid,
		...callDetails
	}: Required<Pick<IGroupVideoConference, 'rid' | 'title' | 'createdBy' | 'providerName'>> &
		Pick<IGroupVideoConference, 'mediaCallIds' | 'sipAlias' | 'discussionRid'>): Promise<string> {
		const call: InsertionModel<IGroupVideoConference> = {
			type: 'videoconference',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			anonymousUsers: 0,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			...(mediaCallIds?.length && { mediaCallIds }),
			...(sipAlias && { sipAlias }),
			...(discussionRid && { discussionRid }),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createLivechat({
		providerName,
		...callDetails
	}: Required<Pick<ILivechatVideoConference, 'rid' | 'createdBy' | 'providerName'>>): Promise<string> {
		const call: InsertionModel<ILivechatVideoConference> = {
			type: 'livechat',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
			...callDetails,
		};

		return (await this.insertOne(call)).insertedId;
	}

	public async createVoIP(call: InsertionModel<IVoIPVideoConference>): Promise<string | undefined> {
		const { externalId, ...data } = call;

		const doc = await this.findOneAndUpdate({ externalId }, { $set: data }, { upsert: true, returnDocument: 'after' });
		return doc?._id;
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<VideoConference> | Partial<VideoConference>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setEndedById(callId: string, endedBy?: { _id: string; name: string; username: string }, endedAt?: Date): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				endedBy,
				endedAt: endedAt || new Date(),
			},
			$unset: {
				sipAlias: true,
			},
		});
	}

	public async setDataById(callId: string, data: Partial<Omit<VideoConference, '_id' | 'sipAlias'>>): Promise<void> {
		const isOver =
			data.status !== undefined &&
			[VideoConferenceStatus.EXPIRED, VideoConferenceStatus.ENDED, VideoConferenceStatus.DECLINED].includes(data.status);

		await this.updateOneById(callId, {
			$set: data,
			...(isOver && { $unset: { sipAlias: true } }),
		});
	}

	public async setRingingById(callId: string, ringing: boolean): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				ringing,
			},
		});
	}

	public async setStatusById(callId: string, status: VideoConference['status']): Promise<void> {
		const isOver = [VideoConferenceStatus.EXPIRED, VideoConferenceStatus.ENDED, VideoConferenceStatus.DECLINED].includes(status);

		await this.updateOneById(callId, {
			$set: {
				status,
			},
			...(isOver && {
				$unset: { sipAlias: true },
			}),
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
							providerData: 1 as const,
						},
					}),
		});
	}

	public async addUserById(
		callId: string,
		user: Required<Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'>> & { ts?: Date },
	): Promise<void> {
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
		} as UpdateFilter<VideoConference>); // TODO: Remove this cast when TypeScript is updated
		// TypeScript is not smart enough to infer that `messages.${'start' | 'end'}` matches two keys of `VideoConference`
	}

	public async updateUserReferences(userId: IUser['_id'], username: IUser['username'], name: IUser['name']): Promise<void> {
		await this.updateMany(
			{
				'users._id': userId,
			},
			{
				$set: {
					'users.$.name': name,
					'users.$.username': username,
				},
			},
		);

		await this.updateMany(
			{
				'createdBy._id': userId,
			},
			{
				$set: {
					'createdBy.name': name,
					'createdBy.username': username,
				},
			},
		);

		await this.updateMany(
			{
				'endedBy._id': userId,
			},
			{
				$set: {
					'endedBy.name': name,
					'endedBy.username': username,
				},
			},
		);
	}

	public async increaseAnonymousCount(callId: IGroupVideoConference['_id']): Promise<void> {
		await this.updateOne(
			{ _id: callId },
			{
				$inc: {
					anonymousUsers: 1,
				},
			},
		);
	}

	public async setDiscussionRidById(callId: string, discussionRid: IRoom['_id']): Promise<void> {
		await this.updateOne({ _id: callId }, { $set: { discussionRid } });
	}

	public async unsetDiscussionRidById(callId: string): Promise<void> {
		await this.updateOne({ _id: callId }, { $unset: { discussionRid: true } });
	}

	public async unsetDiscussionRid(discussionRid: IRoom['_id']): Promise<void> {
		await this.updateMany(
			{
				discussionRid,
			},
			{
				$unset: {
					discussionRid: 1,
				},
			},
		);
	}

	public async findOneByMediaCallId<T extends VideoConference>(callId: string, options?: FindOptions<T>): Promise<T | null> {
		return this.findOne<T>(
			{
				mediaCallIds: callId,
			},
			options || {},
		);
	}

	public async addMediaCallIdByProviderNameAndSipAlias(
		providerName: string,
		sipAlias: string,
		mediaCallId: string,
	): Promise<WithId<VideoConference> | null> {
		return this.findOneAndUpdate(
			{
				providerName,
				sipAlias,
				status: VideoConferenceStatus.STARTED,
				mediaCallIds: { $not: { $eq: mediaCallId } },
			},
			{
				$addToSet: {
					mediaCallIds: mediaCallId,
				},
			},
			{
				returnDocument: 'after',
			},
		);
	}

	public async addMediaCallIdByConferenceId(conferenceId: string, mediaCallId: string): Promise<UpdateResult> {
		return this.updateOneById(conferenceId, {
			$addToSet: {
				mediaCallIds: mediaCallId,
			},
		});
	}

	public async setSipAliasById(callId: string, sipAlias: string): Promise<void> {
		await this.updateOne({ _id: callId }, { $set: { sipAlias } });
	}

	public async unsetSipAliasById(callId: string): Promise<void> {
		await this.updateOne({ _id: callId }, { $unset: { sipAlias: true } });
	}

	public async findOneByProviderNameAndSipAlias<T extends VideoConference>(
		providerName: string,
		sipAlias: string,
		options?: FindOptions<T>,
	): Promise<T | null> {
		return this.findOne<T>(
			{
				providerName,
				sipAlias,
			},
			options || {},
		);
	}
}
