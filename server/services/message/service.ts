import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { DiscussionArgs, IMessageService, MessageFilter, CustomQueryArgs, getUpdatesArgs, getDeletedArgs, getFilesArgs, getThreadsArgs } from '../../sdk/types/IMessageService';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { MessageEnterprise } from '../../sdk';

export class MessageService extends ServiceClass implements IMessageService {
	protected name = 'message';

	private Messages: MessagesRaw;

	constructor(db: Db) {
		super();

		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
	}

	getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<any[] | undefined> {
		throw new Error('Method not implemented.');
	}

	async get(userId: string, filter: MessageFilter): Promise<any[]> {
		const result = await MessageEnterprise.get(userId, filter);
		console.log('result ->', result);
		if (result) {
			return result;
		}

		return this.Messages.findVisibleByRoomId(filter).toArray();
	}

	async getDiscussions(filter: DiscussionArgs): Promise<any[]> {
		const result = await MessageEnterprise.getDiscussions(filter.userId, filter);
		if (result) {
			return result;
		}

		return this.Messages.findDiscussionByRoomId(filter).toArray();
	}

	async customQuery(args: CustomQueryArgs): Promise<any[]> {
		const result = await MessageEnterprise.customQuery(args);
		if (result) {
			return result;
		}

		return this.Messages.find(args.query, args.queryOptions).toArray();
	}

	async getUpdates({ rid, userId, timestamp, queryOptions }: getUpdatesArgs): Promise<any[] | undefined> {
		const result = await MessageEnterprise.getUpdates({ rid, userId, timestamp, queryOptions });

		if (result) {
			return result;
		}

		return this.Messages.findForUpdates(rid, timestamp, queryOptions).toArray();
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

		return this.Messages.findFilesByRoomId({
			rid,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		}).toArray();
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

		return this.Messages.findFilesByRoomId({
			rid,
			excludePinned,
			oldest,
			latest,
			inclusive,
			fromUsers,
			queryOptions,
		}).toArray();
	}
}
