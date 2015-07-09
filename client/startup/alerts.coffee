Meteor.startup ->

	Tracker.autorun ->

		unreadCount = 0
		unreadAlert = false

		subscriptions = ChatSubscription.find({}, { fields: { unread: 1 } })

		for subscription in subscriptions.fetch()
			unreadCount += subscription.unread
			if subscription.alert is true
				unreadAlert = '•'

		rxFavico.set 'type', 'warn'

		if unreadCount > 0
			document.title = '(' + unreadCount + ') Rocket.Chat'
			rxFavico.set 'count', unreadCount
			fireGlobalEvent 'unread-changed', unreadCount

		else if unreadAlert isnt false
			document.title = '(' + unreadAlert + ') Rocket.Chat'
			rxFavico.set 'count', unreadAlert
			fireGlobalEvent 'unread-changed', unreadAlert

		else
			document.title = 'Rocket.Chat'
			rxFavico.set 'count', ''
			fireGlobalEvent 'unread-changed', ''
