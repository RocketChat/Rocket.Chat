Meteor.methods
	resetAvatar: (image, service) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] resetAvatar -> Invalid user")

		console.log '[methods] resetAvatar -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		RocketChatFileAvatarInstance.deleteFile "#{user.username}.jpg"

		RocketChat.models.Users.unsetAvatarOrigin user._id

		RocketChat.Notifications.notifyAll 'updateAvatar', {username: user.username}
		return

# Limit changing avatar once per minute
DDPRateLimiter.addRule
	type: 'method'
	name: 'resetAvatar'
	userId: -> return true
, 1, 60000
