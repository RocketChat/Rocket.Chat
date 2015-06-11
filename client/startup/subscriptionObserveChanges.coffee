Meteor.startup ->
	ChatSubscription.find({}, { fields: { unread: 1 } }).observeChanges
		changed: (id, fields) ->
			if fields.unread and fields.unread > 0
				KonchatNotification.newMessage()
