Meteor.methods
	unreadMessages: (firstUnreadMessage) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'unreadMessages' }

		originalMessage = RocketChat.models.Messages.findOneById firstUnreadMessage._id, {fields: {u: 1, rid: 1, file: 1, ts: 1}}
		if not originalMessage?
			throw new Meteor.Error 'error-action-not-allowed', 'Not allowed', { method: 'unreadMessages', action: 'Unread_messages' }

		if Meteor.userId() is originalMessage.u._id
			throw new Meteor.Error 'error-action-not-allowed', 'Not allowed', { method: 'unreadMessages', action: 'Unread_messages' }

		lastSeen = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, Meteor.userId()).ls
		if firstUnreadMessage.ts >= lastSeen
			logger.connection.debug('Provided message is already marked as unread')
			return

		logger.connection.debug('Updating unread  message of ' + originalMessage.ts + ' as the first unread')
		RocketChat.models.Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, Meteor.userId(), originalMessage.ts)
