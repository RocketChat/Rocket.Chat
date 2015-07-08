Meteor.startup ->

	Tracker.autorun ->
		unreadCount = 0
		subscriptions = ChatSubscription.find({}, { fields: { unread: 1 } })
		(unreadCount += r.unread) for r in subscriptions.fetch()

		rxFavico.set 'type', 'warn'
		rxFavico.set 'count', unreadCount

		if unreadCount > 0
			document.title = '(' + unreadCount + ') Rocket.Chat'
		else
			document.title = 'Rocket.Chat'

		fireGlobalEvent 'set-badge', unreadCount

