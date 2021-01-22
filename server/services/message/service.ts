import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { DiscussionArgs, IMessageService, MessageFilter, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getByIdArgs, getThreadByIdArgs } from '../../sdk/types/IMessageService';
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

	async getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getThreadById({ tmid, userId, queryOptions });
		if (result) {
			return result;
		}

		return this.Messages.findVisibleThreadByThreadId(tmid, queryOptions).toArray();
	}

	async getById({ msgId, userId }: getByIdArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getById({ msgId, userId });
		if (result) {
			return result;
		}

		return this.Messages.findOneById(msgId);
	}

	async getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getDeleted({ rid, userId, timestamp, query, queryOptions });
		if (result) {
			return result;
		}

		const cursor = await this.Messages.trashFindDeletedAfter(timestamp, query, queryOptions);

		if (!cursor) {
			return [];
		}

		const count = cursor.count();
		const trash = cursor.toArray();
		Object.defineProperty(trash, 'count', { value: count });

		return trash;
	}

	async get(userId: string, { rid, latest, oldest, excludeTypes, queryOptions, inclusive, snippeted, mentionsUsername }: MessageFilter): Promise<{records: IMessage[]; total: number}> {
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
			mentionsUsername,
		});

		const total = await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getDiscussions({ rid, excludePinned, ignoreThreads, latest, oldest, inclusive, fromUsers, text, queryOptions, userId }: DiscussionArgs): Promise<any[]> {
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

		const count = cursor.count();
		const discussions = cursor.toArray();
		Object.defineProperty(discussions, 'count', { value: count });

		return discussions;
	}

	async customQuery({ query, userId, queryOptions }: CustomQueryArgs): Promise<any[]> {
		const result = await MessageEnterprise.customQuery({ query, userId, queryOptions });
		if (result) {
			return result;
		}

		const cursor = this.Messages.find(query, queryOptions);

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getUpdates({ rid, userId, timestamp, queryOptions });

		if (result) {
			return result;
		}

		const cursor = this.Messages.findForUpdates(rid, timestamp, queryOptions);

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<any[] | undefined> {
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

		const count = cursor.count();
		const messages = cursor.toArray();
		Object.defineProperty(messages, 'count', { value: count });

		return messages;
	}

	async getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getFiles({
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

		const cursor = this.Messages.findFilesByRoomId({
			rid,
			excludePinned,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		const count = cursor.count();
		const threads = cursor.toArray();
		Object.defineProperty(threads, 'count', { value: count });

		return threads;
	}
}
