Meteor.methods
	updateMessage: (message) ->

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		message.ets = new Date()
		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		ChatMessage.update
			_id: message.id
			'u._id': Meteor.userId
		,
			$set: message
