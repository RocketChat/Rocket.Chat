Meteor.startup ->

	Tracker.autorun ->

		unreadCount = 0
		unreadAlert = false

		subscriptions = ChatSubscription.find({open: true}, { fields: { unread: 1, alert: 1, rid: 1, t: 1, name: 1, ls: 1 } })

		openedRoomId = undefined
		Tracker.nonreactive ->
			if FlowRouter.getRouteName() in ['channel', 'group', 'direct']
				openedRoomId = Session.get 'openedRoom'

		for subscription in subscriptions.fetch()

			if subscription.alert or subscription.unread > 0
				# This logic is duplicated in /client/notifications/notification.coffee.
				hasFocus = readMessage.isEnable()
				subscriptionIsTheOpenedRoom = openedRoomId is subscription.rid
				if hasFocus and subscriptionIsTheOpenedRoom
					# The user has probably read all messages in this room.
					# TODO: readNow() should return whether it has actually marked the room as read.
					Meteor.setTimeout ->
						readMessage.readNow()
					, 500

				# Increment the total unread count.
				unreadCount += subscription.unread
				if subscription.alert is true
					unreadAlert = '•'

			if RoomManager.openedRooms[subscription.t + subscription.name]
				readMessage.refreshUnreadMark(subscription.rid)

		menu.updateUnreadBars()

		if unreadCount > 0
			if unreadCount > 999
				Session.set 'unread', '999+'
			else
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
		siteName = RocketChat.settings.get('Site_Name') or ''

		unread = Session.get 'unread'
		fireGlobalEvent 'unread-changed', unread
		favico?.badge unread, bgColor: if typeof unread isnt 'number' then '#3d8a3a' else '#ac1b1b'
		document.title = if unread == '' then siteName else '(' + unread + ') '+ siteName
