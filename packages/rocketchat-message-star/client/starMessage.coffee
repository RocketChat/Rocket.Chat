Meteor.methods
	starMessage: (message) ->
		if not Meteor.userId()
			return false

		room = RocketChat.models.Rooms.findOne({ _id: message.rid })

		if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
			return false

		if not RocketChat.settings.get 'Message_AllowStarring'
			return false

		ChatMessage.update
			_id: message._id
		,
			$set: { starred: !!message.starred }
