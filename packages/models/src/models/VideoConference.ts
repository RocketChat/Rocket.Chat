import type {
	VideoConference,
	IGroupVideoConference,
	ILivechatVideoConference,
	IUser,
	IRoom,
	RocketChatRecordDeleted,
	IVoIPVideoConference,
	IVideoConferenceParticipant,
	VideoConferenceLeaveReason,
} from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import type { FindPaginated, InsertionModel, IVideoConferenceModel } from '@rocket.chat/model-typings';
import type {
	FindCursor,
	UpdateOptions,
	UpdateFilter,
	UpdateResult,
	IndexDescription,
	Collection,
	Db,
	CountDocumentsOptions,
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
			// `createdAt` is part of the key so the `$or: [{ rid }, { discussionRid }]` listing below can be
			// served by an index-ordered merge instead of a blocking in-memory sort of the whole room history.
			{ key: { discussionRid: 1, createdAt: 1 }, unique: false },
			// Listing the calls that are running: a sparse index, because a conference carries `endedAt` only once
			// it has stopped, so the index holds just the handful that are live.
			{ key: { endedAt: 1, createdAt: -1 }, unique: false, sparse: true },
		];
	}

	public findPaginatedByRoomId(
		rid: IRoom['_id'],
		{ offset, count }: { offset?: number; count?: number } = {},
	): FindPaginated<FindCursor<VideoConference>> {
		// Matches conferences started in this room (`rid`) and those whose discussion *is* this room
		// (`discussionRid`), so a discussion resolves the conference it belongs to — its members may have no
		// access to the parent room the conference originated in.
		return this.findPaginated<VideoConference>(
			{ $or: [{ rid }, { discussionRid: rid }] },
			{
				sort: { createdAt: -1 },
				skip: offset,
				limit: count,
				projection: {
					providerData: 0,
				},
			},
		);
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
		...callDetails
	}: Required<Pick<IGroupVideoConference, 'rid' | 'title' | 'createdBy' | 'providerName' | 'ringing'>>): Promise<string> {
		const call: InsertionModel<IGroupVideoConference> = {
			type: 'videoconference',
			users: [],
			messages: {},
			status: VideoConferenceStatus.STARTED,
			anonymousUsers: 0,
			createdAt: new Date(),
			providerName: providerName.toLowerCase(),
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
		});
	}

	public async setDataById(callId: string, data: Partial<Omit<VideoConference, '_id'>>): Promise<void> {
		await this.updateOneById(callId, {
			$set: data,
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

	public async setTitleById(callId: string, title: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				title,
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

	/**
	 * Adds a member to the conference, doing nothing if they are already one.
	 *
	 * The guard lives in the *query*, not in a read-then-write: `$addToSet` compares whole documents, so once
	 * an entry can be mutated (by `setUserJoinedById` below) it would no longer match and a second call would
	 * append a duplicate. Filtering on `users._id` makes this atomic and idempotent in one update, which also
	 * removes the race in a caller that checks membership in memory first.
	 */
	public async addMemberById(
		callId: string,
		user: Required<Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'>> & { ts?: Date },
	): Promise<void> {
		await this.updateOne(
			{ '_id': callId, 'users._id': { $ne: user._id } },
			{
				$push: {
					users: {
						_id: user._id,
						username: user.username,
						name: user.name,
						avatarETag: user.avatarETag,
						ts: user.ts || new Date(),
						// Being a member is not being in the call. Whoever is arriving says so with `setUserJoinedById`.
						joined: false,
					},
				},
			},
		);
	}

	/** Marks an existing member as being in the call, mutating their entry in place. */
	public async setUserJoinedById(callId: string, uid: IUser['_id'], joinedAt = new Date()): Promise<void> {
		await this.updateOne(
			{ _id: callId },
			{
				// Joining is the first renewal of the member's presence lease: it is the strongest evidence there
				// is that they are in the call, and stamping it here saves a second write to say so.
				$set: { 'users.$[user].joined': true, 'users.$[user].joinedAt': joinedAt, 'users.$[user].lastSeenAt': joinedAt },
				// Rejoining makes an earlier departure meaningless: leaving it behind would report the member as
				// gone while they are on the call, and could end the call under them.  Clearing ringingAt stops
				// the caller's ringback tone — the person answered.
				$unset: { 'users.$[user].leftAt': 1, 'users.$[user].leftReason': 1, 'users.$[user].ringingAt': 1 },
			},
			{ arrayFilters: [{ 'user._id': uid }] },
		);
	}

	/**
	 * Renews a member's presence lease — their call window reporting that it is still in the call.
	 *
	 * A renewal also undoes a departure that was *inferred*: a lease we gave up on while the window was in fact
	 * alive was simply wrong, and the window saying so is the correction. A departure the member reported is
	 * never undone this way — they left, and a heartbeat still in flight behind them must not put them back in
	 * the call. That is the condition in the query, which is why a stale renewal matches nothing at all.
	 */
	public async renewUserPresenceById(
		callId: string,
		uid: IUser['_id'],
		lastSeenAt = new Date(),
		inferredReasons: VideoConferenceLeaveReason[] = ['timeout'],
	): Promise<void> {
		await this.updateOne(
			{
				_id: callId,
				users: { $elemMatch: { _id: uid, $or: [{ leftAt: { $exists: false } }, { leftReason: { $in: inferredReasons } }] } },
			},
			{
				$set: { 'users.$[user].lastSeenAt': lastSeenAt },
				$unset: { 'users.$[user].leftAt': 1, 'users.$[user].leftReason': 1 },
			},
			{ arrayFilters: [{ 'user._id': uid }] },
		);
	}

	/**
	 * Renews several members' leases at once — what a provider that can be asked who is in its room answers
	 * with. Unlike a client's own heartbeat this never revives an inferred departure: the provider is reporting
	 * a room, not a member correcting us about their own window.
	 */
	public async renewUsersPresenceById(callId: string, uids: IUser['_id'][], lastSeenAt = new Date()): Promise<void> {
		if (!uids.length) {
			return;
		}

		await this.updateOne(
			{ _id: callId },
			{ $set: { 'users.$[user].lastSeenAt': lastSeenAt } },
			{ arrayFilters: [{ 'user._id': { $in: uids } }] },
		);
	}

	/** Records that we just rang these members, so every client can tell a ringing phone from a silent one. */
	public async setUsersRingingById(callId: string, uids: IUser['_id'][], ringingAt = new Date()): Promise<void> {
		if (!uids.length) {
			return;
		}

		await this.updateOne(
			{ _id: callId },
			{ $set: { 'users.$[user].ringingAt': ringingAt } },
			{ arrayFilters: [{ 'user._id': { $in: uids } }] },
		);
	}

	/**
	 * `reason` says how the departure came to be known, and is only written when there is something to say: an
	 * absent one reads as reported, which is what every entry written before leases existed was.
	 */
	public async setUserLeftById(callId: string, uid: IUser['_id'], leftAt = new Date(), reason?: VideoConferenceLeaveReason): Promise<void> {
		await this.updateOne(
			{ _id: callId },
			{ $set: { 'users.$[user].leftAt': leftAt, ...(reason && { 'users.$[user].leftReason': reason }) } },
			{ arrayFilters: [{ 'user._id': uid }] },
		);
	}

	/** Records that an existing member dismissed the call, mutating their entry in place. */
	public async setUserDeclinedById(callId: string, uid: IUser['_id'], declinedAt = new Date()): Promise<void> {
		await this.updateOne(
			{ _id: callId },
			{ $set: { 'users.$[user].declined': true, 'users.$[user].declinedAt': declinedAt } },
			{ arrayFilters: [{ 'user._id': uid }] },
		);
	}

	public async setMessageById(callId: string, messageType: keyof VideoConference['messages'], messageId: string): Promise<void> {
		await this.updateOneById(callId, {
			$set: {
				[`messages.${messageType}`]: messageId,
			},
		});
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

	// --- Embedded SFU (LiveKit) helpers ---
	// URL-based providers (Jitsi/Meet/Zoom) never call these. The data shape
	// is described in the IVideoConferenceParticipant type in core-typings.

	public async findActiveEmbeddedInRoom(rid: IRoom['_id'], providerName: string): Promise<VideoConference | null> {
		// "active" means the call is open (not ENDED/EXPIRED/DECLINED). Embedded
		// providers use the standard VideoConferenceStatus lifecycle.
		return this.findOne({
			rid,
			providerName,
			status: { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] },
		});
	}

	/**
	 * Every call that is still open, with what the presence sweep needs to judge it: who is on the roster, and
	 * which provider is running the media — the one that may be able to say who is in the room.
	 *
	 * Deliberately not scoped to a provider or to an age. Any open call has leases to check, and one whose
	 * members all vanished ten seconds ago is exactly as stuck as one that has been that way for hours.
	 */
	public findActiveWithMembers(): FindCursor<Pick<VideoConference, '_id' | 'rid' | 'users' | 'providerName'>> {
		return this.find(
			{
				status: { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] },
				endedAt: { $exists: false },
			},
			{ projection: { _id: 1, rid: 1, users: 1, providerName: 1 } },
		);
	}

	public async addEmbeddedParticipant(callId: VideoConference['_id'], participant: IVideoConferenceParticipant): Promise<void> {
		// Pull any prior entry for this user first so a re-join doesn't
		// leave a leftAt'd ghost in the array alongside the fresh entry.
		await this.updateOne({ _id: callId }, { $pull: { participants: { id: participant.id } } } as any);
		await this.updateOne({ _id: callId }, {
			$push: { participants: { ...participant, joinedAt: participant.joinedAt ?? new Date() } },
		} as any);
	}

	public async markEmbeddedParticipantLeft(callId: VideoConference['_id'], userId: IUser['_id'], leftAt = new Date()): Promise<void> {
		await this.updateOne({ '_id': callId, 'participants.id': userId }, { $set: { 'participants.$.leftAt': leftAt } } as any);
	}
}
