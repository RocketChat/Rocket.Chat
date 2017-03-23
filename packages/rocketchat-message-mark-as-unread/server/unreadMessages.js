import logger from './logger';
Meteor.methods({
	unreadMessages: function(firstUnreadMessage) {
		var lastSeen, originalMessage;
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages'
			});
		}
		originalMessage = RocketChat.models.Messages.findOneById(firstUnreadMessage._id, {
			fields: {
				u: 1,
				rid: 1,
				file: 1,
				ts: 1
			}
		});
		if (originalMessage == null || Meteor.userId() === originalMessage.u._id) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'unreadMessages',
				action: 'Unread_messages'
			});
		}
		lastSeen = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, Meteor.userId()).ls;
		if (firstUnreadMessage.ts >= lastSeen) {
			logger.connection.debug('Provided message is already marked as unread');
		}
	}
});
