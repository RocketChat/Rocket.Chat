import { Db } from 'mongodb';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { MessageFilter, DiscussionArgs, CustomQueryArgs } from '../../../server/sdk/types/IMessageService';
import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { IMessageEnterprise } from '../../../server/sdk/types/IMessageEnterprise';
import { hasLicense } from '../license/server/license';

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

	async get(userId: string, filter: MessageFilter): Promise<any[] | undefined> {
		console.log('MessageEnterprise', userId, filter);

		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(filter.rid, userId);
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(filter.rid, userId);

			if ((userJoinedAt && filter.oldest)
				&& (userJoinedAt.ts > filter.oldest)) {
				filter.oldest = userJoinedAt.ts;
			}
		}

		console.log('enterprise filter');

		return this.Messages.findVisibleByRoomId(filter).toArray();
	}

	async getDiscussions(filter: DiscussionArgs): Promise<any[] | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(filter.rid, filter.userId);

		let oldest;
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(filter.rid, filter.userId);

			if (userJoinedAt) {
				oldest = userJoinedAt.ts;
			}
		}

		return this.Messages.findDiscussionsByRoom({
			rid: filter.rid,
			queryOptions: filter.queryOptions,
			text: filter.text,
			oldest,
		}).toArray();
	}

	async customQuery({ query, queryOptions, userId }: CustomQueryArgs): Promise<any[] | undefined> {
		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		const r = await this.Rooms.findOneByRoomIdAndUserId(query.rid, userId, queryOptions);

		let oldest;
		if (r.hideHistoryForNewMembers) {
			const userJoinedAt = await this.Subscriptions.findOneByRoomIdAndUserId(query.rid, userId);

			if (userJoinedAt) {
				oldest = userJoinedAt.ts;
				query.ts.$gte = oldest;
			}
		}

		return this.Messages.find(query, queryOptions).toArray();
	}
}
