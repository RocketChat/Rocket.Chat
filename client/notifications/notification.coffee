# Show notifications and play a sound for new messages.
# We trust the server to only send notifications for interesting messages, e.g. direct messages or
# group messages in which the user is mentioned.

Meteor.startup ->
	Tracker.autorun ->
		if Meteor.userId()
			RocketChat.Notifications.onUser 'notification', (notification) ->

				openedRoomId = undefined
				if FlowRouter.getRouteName() in ['channel', 'group', 'direct']
					openedRoomId = Session.get 'openedRoom'

				# This logic is duplicated in /client/startup/unread.coffee.
				hasFocus = readMessage.isEnable()
				messageIsInOpenedRoom = openedRoomId is notification.payload.rid

				fireGlobalEvent 'notification',
					notification: notification
					fromOpenedRoom: messageIsInOpenedRoom
					hasFocus: hasFocus

				if RocketChat.Layout.isEmbedded()
					if !hasFocus and messageIsInOpenedRoom
						# Play a sound and show a notification.
						KonchatNotification.newMessage()
						KonchatNotification.showDesktop notification
				else if !(hasFocus and messageIsInOpenedRoom)
					# Play a sound and show a notification.
					KonchatNotification.newMessage()
					KonchatNotification.showDesktop notification
