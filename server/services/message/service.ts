import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { DiscussionArgs, IMessageService, MessageFilter, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs, getThreadByIdArgs } from '../../sdk/types/IMessageService';
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

	async getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getThreadById({ tmid, userId, queryOptions });
		if (result) {
			return result;
		}

		const cursor = this.Messages.findVisibleThreadByThreadId(tmid, queryOptions);
		const records = await cursor.toArray();
		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();

		return { records, total };
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

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
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

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
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

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async customQuery({ query, userId, queryOptions }: CustomQueryArgs): Promise<{records: IMessage[]; total?: number}> {
		const result = await MessageEnterprise.customQuery({ query, userId, queryOptions });
		if (result) {
			return result;
		}

		const cursor = this.Messages.find(query, queryOptions);

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
		const result = await MessageEnterprise.getUpdates({ rid, userId, timestamp, queryOptions });

		if (result) {
			return result;
		}

		const cursor = this.Messages.findForUpdates(rid, timestamp, queryOptions);

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
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

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}

	async getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<{records: IMessage[]; total?: number} | undefined> {
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

		const cursor = this.Messages.findThreadsByRoomId({
			rid,
			excludePinned,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		});

		const total = queryOptions?.returnTotal === false ? undefined : await cursor.count();
		const records = await cursor.toArray();

		return { records, total };
	}
}
