Meteor.startup ->
	RocketChat.Notifications.onAll 'updateAvatar', (data) ->
		updateAvatarOfUsername data.username
