import { Db, Cursor } from 'mongodb';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { MessageFilter, DiscussionArgs, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getThreadByIdArgs, QueryOptions } from '../../../server/sdk/types/IMessageService';
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

	private async getOldestDateForUser(rid: string, userId: string, oldest?: Date): Promise<Date | undefined> {
		const room = await this.Rooms.findOneByRoomIdAndUserId(rid, userId, {
			projection: {
				hideHistoryForNewMembers: 1,
			},
		});

		if (room?.hideHistoryForNewMembers) {
			const subscription = await this.Subscriptions.findOneByRoomIdAndUserId(rid, userId, {
				projection: {
					ts: 1,
				},
			});

			if (subscription?.ts) {
				if (oldest && oldest > subscription.ts) {
					return oldest;
				}

				return subscription.ts;
			}
		}

		return oldest;
	}

	private async getResultWithTotal(cursor: Cursor, queryOptions?: QueryOptions): Promise<{ records: IMessage[]; total?: number }> {
		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async get(userId: string, { rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, pinned, mentionsUsername }: MessageFilter): Promise<{ records: IMessage[]; total?: number } | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		oldest = await this.getOldestDateForUser(rid, userId, oldest);

		const cursor = this.Messages.findVisibleByRoomId({ rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, pinned, mentionsUsername });

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getDiscussions({ rid, excludePinned, ignoreThreads, latest, oldest, inclusive, fromUsers, text, queryOptions, userId }: DiscussionArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		oldest = await this.getOldestDateForUser(rid, userId, oldest);

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

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async customQuery({ query, queryOptions, userId }: CustomQueryArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const oldest = await this.getOldestDateForUser(query.rid, userId);
		if (oldest) {
			query.ts = query.ts || {};
			query.ts.$gte = oldest;
		}

		const cursor = this.Messages.find(query, queryOptions);

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		timestamp = await this.getOldestDateForUser(rid, userId, timestamp) || timestamp;

		const cursor = this.Messages.findForUpdates(rid, timestamp, queryOptions);

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		timestamp = await this.getOldestDateForUser(rid, userId, timestamp) || timestamp;

		const cursor = this.Messages.trashFindDeletedAfter(timestamp, query, queryOptions);

		if (!cursor) {
			return { records: [], total: 0 };
		}

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		oldest = await this.getOldestDateForUser(rid, userId, oldest);

		const cursor = this.Messages.findFilesByRoomId({
			rid,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		oldest = await this.getOldestDateForUser(rid, userId, oldest);

		const cursor = this.Messages.findThreadsByRoomId({
			rid,
			excludePinned,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		return this.getResultWithTotal(cursor, queryOptions);
	}

	getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		return this.customQuery({ query: { tmid, _hidden: { $ne: true } }, userId, queryOptions });
	}
}
