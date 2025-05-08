import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import logger from './logger';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unreadMessages(firstUnreadMessage?: Pick<IMessage, '_id'>, room?: IRoom['_id']): void;
	}
}

export const unreadMessages = async (userId: string, firstUnreadMessage?: Pick<IMessage, '_id'>, room?: IRoom['_id']): Promise<void> => {
	if (room && typeof room === 'string') {
		const lastMessage = (
			await Messages.findVisibleByRoomId(room, {
				limit: 1,
				sort: { ts: -1 },
			}).toArray()
		)[0];

		if (!lastMessage) {
			throw new Meteor.Error('error-no-message-for-unread', 'There are no messages to mark unread', {
				method: 'unreadMessages',
				action: 'Unread_messages',
			});
		}

		const setAsUnreadResponse = await Subscriptions.setAsUnreadByRoomIdAndUserId(lastMessage.rid, userId, lastMessage.ts);
		if (setAsUnreadResponse.modifiedCount) {
			void notifyOnSubscriptionChangedByRoomIdAndUserId(lastMessage.rid, userId);
		}

		return;
	}

	if (typeof firstUnreadMessage?._id !== 'string') {
		throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
			method: 'unreadMessages',
			action: 'Unread_messages',
		});
	}

	const originalMessage = await Messages.findOneById(firstUnreadMessage._id, {
		projection: {
			u: 1,
			rid: 1,
			ts: 1,
		},
	});
	if (!originalMessage || userId === originalMessage.u._id) {
		throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
			method: 'unreadMessages',
			action: 'Unread_messages',
		});
	}
	const lastSeen = (await Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId))?.ls;
	if (!lastSeen) {
		throw new Meteor.Error('error-subscription-not-found', 'Subscription not found', {
			method: 'unreadMessages',
			action: 'Unread_messages',
		});
	}

	if (originalMessage.ts >= lastSeen) {
		return logger.debug('Provided message is already marked as unread');
	}

	logger.debug(`Updating unread message of ${originalMessage.ts} as the first unread`);
	const setAsUnreadResponse = await Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, userId, originalMessage.ts);
	if (setAsUnreadResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(originalMessage.rid, userId);
	}
};

Meteor.methods<ServerMethods>({
	async unreadMessages(firstUnreadMessage, room) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}

		return unreadMessages(userId, firstUnreadMessage, room);
	},
});
