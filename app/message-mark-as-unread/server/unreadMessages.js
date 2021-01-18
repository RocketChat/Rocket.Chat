import { Meteor } from 'meteor/meteor';

import logger from './logger';
import { Messages, Subscriptions } from '../../models';
import { Message } from '../../../server/sdk';

Meteor.methods({
	unreadMessages(firstUnreadMessage, rid) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}

		if (rid) {
			const lastMessage = Promise.await(Message.get(userId, { rid, queryOptions: { limit: 1, sort: { ts: -1 } } }))[0];

			if (lastMessage == null) {
				throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
					method: 'unreadMessages',
					action: 'Unread_messages',
				});
			}

			return Subscriptions.setAsUnreadByRoomIdAndUserId(lastMessage.rid, userId, lastMessage.ts);
		}

		// TODO evaluate limit history visibility
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
			return logger.connection.debug('Provided message is already marked as unread');
		}
		logger.connection.debug(`Updating unread  message of ${ originalMessage.ts } as the first unread`);
		return Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, userId, originalMessage.ts);
	},
});
