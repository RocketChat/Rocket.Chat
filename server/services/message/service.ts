import { Db, Cursor } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { DiscussionArgs, IMessageService, MessageFilter, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getThreadByIdArgs, QueryOptions } from '../../sdk/types/IMessageService';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { MessageEnterprise } from '../../sdk';
import { IMessage } from '../../../definition/IMessage';

export class MessageService extends ServiceClass implements IMessageService {
	protected name = 'message';

	private Messages: MessagesRaw;

	constructor(db: Db) {
		super();

		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
	}

	private async getResultWithTotal(cursor: Cursor, queryOptions?: QueryOptions): Promise<{ records: IMessage[]; total?: number }> {
		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getThreadById({ tmid, userId, queryOptions });
		if (result) {
			return result;
		}

		const cursor = this.Messages.findVisibleThreadByThreadId(tmid, queryOptions);

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getDeleted({ rid, userId, timestamp, query, queryOptions });
		if (result) {
			return result;
		}

		const cursor = await this.Messages.trashFindDeletedAfter(timestamp, query, queryOptions);

		if (!cursor) {
			return { records: [], total: 0 };
		}

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async get(userId: string, { rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, pinned, mentionsUsername }: MessageFilter): Promise<{ records: IMessage[]; total?: number }> {
		const result = await MessageEnterprise.get(userId, {
			rid,
			latest,
			oldest,
			inclusive,
			excludeTypes,
			queryOptions,
			snippeted,
			mentionsUsername,
		});

		if (result) {
			return result;
		}

		const cursor = this.Messages.findVisibleByRoomId({
			rid,
			latest,
			oldest,
			excludeTypes,
			queryOptions,
			inclusive,
			snippeted,
			pinned,
			mentionsUsername,
		});

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getDiscussions({ rid, excludePinned, ignoreThreads, latest, oldest, inclusive, fromUsers, text, queryOptions, userId }: DiscussionArgs): Promise<{records: IMessage[]; total?: number}> {
		const result = await MessageEnterprise.getDiscussions({
			rid,
			excludePinned,
			ignoreThreads,
			latest,
			oldest,
			inclusive,
			fromUsers,
			text,
			queryOptions,
			userId,
		});
		if (result) {
			return result;
		}

		const cursor = this.Messages.findDiscussionByRoomId({
			rid,
			excludePinned,
			ignoreThreads,
			latest,
			oldest,
			inclusive,
			fromUsers,
			text,
			queryOptions,
		});

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async customQuery({ query, userId, queryOptions }: CustomQueryArgs): Promise<{records: IMessage[]; total?: number}> {
		const result = await MessageEnterprise.customQuery({ query, userId, queryOptions });
		if (result) {
			return result;
		}

		const cursor = this.Messages.find(query, queryOptions);

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getUpdates({ rid, userId, timestamp, queryOptions });

		if (result) {
			return result;
		}

		const cursor = this.Messages.findForUpdates(rid, timestamp, queryOptions);

		return this.getResultWithTotal(cursor, queryOptions);
	}

	async getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getFiles({
			rid,
			userId,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		if (result) {
			return result;
		}

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
		const result = await MessageEnterprise.getThreadsByRoomId({
			rid,
			userId,
			excludePinned,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		if (result) {
			return result;
		}

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
}
