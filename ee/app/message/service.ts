import { Db } from 'mongodb';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { MessageFilter, DiscussionArgs, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getByIdArgs, getThreadByIdArgs } from '../../../server/sdk/types/IMessageService';
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

	async getDiscussions(filter: DiscussionArgs): Promise<any[] | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(filter.rid, filter.userId, {});

		let oldest;
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(filter.rid, filter.userId);

			if (userJoinedAt) {
				oldest = userJoinedAt.ts;
			}
		}

		const cursor = this.Messages.findDiscussionByRoomId({
			rid: filter.rid,
			queryOptions: filter.queryOptions,
			text: filter.text,
			oldest,
			latest: filter.latest,
			inclusive: filter.inclusive,
			excludePinned: filter.excludePinned,
			fromUsers: filter.fromUsers,
			ignoreThreads: filter.ignoreThreads,
		});

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async customQuery({ query, queryOptions, userId }: CustomQueryArgs): Promise<any[] | undefined> {
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

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<any[] | undefined> {
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

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<any[] | undefined> {
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
			return [];
		}

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<any[] | undefined> {
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

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<any[] | undefined> {
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
			oldest: end,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	getById({ msgId, userId }: getByIdArgs): Promise<any[] | undefined> {
		return this.customQuery({ query: { _id: msgId }, userId });
	}

	getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<any[] | undefined> {
		return this.customQuery({ query: { tmid, _hidden: { $ne: true } }, userId, queryOptions });
	}
}
