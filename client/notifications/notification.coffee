Meteor.startup ->
	RocketChat.Notifications.onUser 'notification', (data) ->
		KonchatNotification.showDesktop data
