Meteor.startup ->

	ChatSubscription.find({}, { fields: { unread: 1 } }).observeChanges
		changed: (id, fields) ->
			if fields.unread and fields.unread > 0
				KonchatNotification.newMessage()

Meteor.startup ->

	Tracker.autorun ->

		unreadCount = 0
		unreadAlert = false

		subscriptions = ChatSubscription.find({}, { fields: { unread: 1, alert: 1 } })

		for subscription in subscriptions.fetch()
			unreadCount += subscription.unread
			if subscription.alert is true
				unreadAlert = '•'

		if unreadCount > 0
			Session.set 'unread', unreadCount
		else if unreadAlert isnt false
			Session.set 'unread', unreadAlert
		else
			Session.set 'unread', ''

Meteor.startup ->

	window.favico = new Favico
		position: 'up'
		animation: 'none'

	Tracker.autorun ->

		unread = Session.get 'unread'
		fireGlobalEvent 'unread-changed', unread
		favico?.badge unread, bgColor: if typeof unread isnt 'number' then '#3d8a3a' else '#ac1b1b'
		document.title = if unread == '' then 'Rocket.Chat' else '(' + unread + ') Rocket.Chat'
