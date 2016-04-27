Meteor.methods
	starMessage: (message) ->
		if not Meteor.userId()
			return false

		if not RocketChat.settings.get 'Message_AllowStarring'
			return false

		ChatMessage.update
			_id: message._id
		,
			$set: { starred: !!message.starred }
