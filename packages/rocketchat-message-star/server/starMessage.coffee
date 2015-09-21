Meteor.methods
	starMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] starMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowStarring'
			throw new Meteor.Error 'message-starring-not-allowed', "[methods] starMessage -> Message starring not allowed"

		console.log '[methods] starMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if message.starred
			ChatMessage.update
				_id: message._id
			,
				$addToSet:
					starred: { _id: Meteor.userId() }
		else
			ChatMessage.update
				_id: message._id
			,
				$pull:
					starred: { _id: Meteor.userId() }
