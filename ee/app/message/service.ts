import { Db } from 'mongodb';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { MessageFilter, DiscussionArgs, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getThreadByIdArgs } from '../../../server/sdk/types/IMessageService';
import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { IMessageEnterprise } from '../../../server/sdk/types/IMessageEnterprise';
import { hasLicense } from '../license/server/license';
import { IMessage } from '../../../definition/IMessage';

export class MessageEnterprise extends ServiceClass implements IMessageEnterprise {
	protected name = 'ee-message';

	private Messages: MessagesRaw;

	private Rooms: RoomsRaw;

	private Subscriptions: SubscriptionsRaw;

	constructor(db: Db) {
		super();

		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
		this.Rooms = new RoomsRaw(db.collection('rocketchat_room'));
		this.Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'));
	}

	async get(userId: string, { rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, mentionsUsername }: MessageFilter): Promise<{records: IMessage[]; total: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

			if ((userJoinedAt && oldest)
				&& (userJoinedAt.ts > oldest)) {
				oldest = userJoinedAt.ts;
			}
		}

		const cursor = this.Messages.findVisibleByRoomId({ rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, mentionsUsername });
		const total = await cursor.count();
		const records = await cursor.toArray() as IMessage[];

		return { records, total };
	}

	async getDiscussions({ rid, excludePinned, ignoreThreads, latest, oldest, inclusive, fromUsers, text, queryOptions, userId }: DiscussionArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});

		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

			if (userJoinedAt) {
				oldest = userJoinedAt.ts;
			}
		}

		const cursor = this.Messages.findDiscussionByRoomId({
			rid,
			queryOptions,
			text,
			oldest,
			latest,
			inclusive,
			excludePinned,
			fromUsers,
			ignoreThreads,
		});

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async customQuery({ query, queryOptions, userId }: CustomQueryArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(query.rid, userId, queryOptions);

		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(query.rid, userId);

			if (userJoinedAt) {
				query.ts.$gte = userJoinedAt.ts;
			}
		}

		const cursor = this.Messages.find(query, queryOptions);

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});

		let ts;
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

			if (userJoinedAt) {
				userJoinedAt.ts > timestamp ? ts = userJoinedAt : ts = timestamp;
			}
		}

		const cursor = this.Messages.findForUpdates(rid, ts, queryOptions);

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});

		let ts = timestamp;
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

			if (userJoinedAt && userJoinedAt.ts > timestamp) {
				ts = userJoinedAt.ts;
			}
		}

		const cursor = this.Messages.trashFindDeletedAfter(ts, query, queryOptions);

		if (!cursor) {
			return { records: [], total: 0 };
		}

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});

		const userJoinedAt = r.hideHistoryForNewMembers && await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		let end;
		if (!oldest || (userJoinedAt && userJoinedAt.ts > oldest)) {
			end = userJoinedAt;
		}

		const cursor = this.Messages.findFilesByRoomId({
			rid,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
			oldest: end,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {});

		const userJoinedAt = r.hideHistoryForNewMembers && await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId);

		let end;
		if (!oldest || (userJoinedAt && userJoinedAt.ts > oldest)) {
			end = userJoinedAt;
		}

		const cursor = this.Messages.findThreadsByRoomId({
			rid,
			excludePinned,
			oldest: end,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		return this.customQuery({ query: { tmid, _hidden: { $ne: true } }, userId, queryOptions });
	}
}
