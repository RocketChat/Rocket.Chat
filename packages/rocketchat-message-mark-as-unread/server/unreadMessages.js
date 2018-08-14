import logger from './logger';
Meteor.methods({
	unreadMessages(firstUnreadMessage, room) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages'
			});
		}

		if (room) {
			const lastMessage = RocketChat.models.Messages.findVisibleByRoomId(room, {limit: 1, sort: {ts: -1}}).fetch()[0];

			if (lastMessage == null) {
				throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
					method: 'unreadMessages',
					action: 'Unread_messages'
				});
			}

			return RocketChat.models.Subscriptions.setAsUnreadByRoomIdAndUserId(lastMessage.rid, userId, lastMessage.ts);
		}

		const originalMessage = RocketChat.models.Messages.findOneById(firstUnreadMessage._id, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1
			}
		});
		if (originalMessage == null || userId === originalMessage.u._id) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'unreadMessages',
				action: 'Unread_messages'
			});
		}
		const lastSeen = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId).ls;
		if (firstUnreadMessage.ts >= lastSeen) {
			return logger.connection.debug('Provided message is already marked as unread');
		}
		logger.connection.debug(`Updating unread  message of ${ originalMessage.ts } as the first unread`);
		return RocketChat.models.Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, userId, originalMessage.ts);
	}
});
