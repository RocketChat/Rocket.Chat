import { Meteor } from 'meteor/meteor';

import logger from './logger';
import { Messages, Subscriptions } from '../../models/server';

Meteor.methods({
	unreadMessages(firstUnreadMessage, room) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}

		const unreadMessages = Messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
			room || firstUnreadMessage?.rid,
			!firstUnreadMessage ? new Date(0) : new Date((firstUnreadMessage?.ts).getTime() - 1),
			new Date(Date.now()),
			'',
			{
				sort: {
					ts: 1,
				},
			},
			false,
		).fetch();

		if (room && typeof room === 'string') {
			const lastMessage = unreadMessages[0];

			if (lastMessage == null) {
				throw new Meteor.Error('error-no-message-for-unread', 'There are no messages to mark unread', {
					method: 'unreadMessages',
					action: 'Unread_messages',
				});
			}

			return Subscriptions.setAsUnreadByRoomIdAndUserId(lastMessage.rid, userId, lastMessage.ts, unreadMessages.length);
		}

		if (typeof firstUnreadMessage?._id !== 'string') {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'unreadMessages',
				action: 'Unread_messages',
			});
		}

		const originalMessage = Messages.findOneById(firstUnreadMessage._id, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1,
			},
		});
		if (originalMessage == null || userId === originalMessage.u._id) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'unreadMessages',
				action: 'Unread_messages',
			});
		}
		const lastSeen = Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId).ls;
		if (firstUnreadMessage.ts >= lastSeen) {
			return logger.debug('Provided message is already marked as unread');
		}
		logger.debug(`Updating unread  message of ${originalMessage.ts} as the first unread`);
		return Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, userId, originalMessage.ts, unreadMessages.length);
	},
});
