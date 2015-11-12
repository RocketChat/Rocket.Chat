Meteor.methods
	starMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] starMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowStarring'
			throw new Meteor.Error 'message-starring-not-allowed', "[methods] starMessage -> Message starring not allowed"

		console.log '[methods] starMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred)
