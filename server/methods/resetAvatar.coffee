Meteor.methods
	resetAvatar: (image, service) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] resetAvatar -> Invalid user")

		console.log '[methods] resetAvatar -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		RocketChatFileAvatarInstance.deleteFile "#{user.username}.jpg"

		Meteor.users.update user._id, {$unset: {avatarOrigin: 1}}
		return
