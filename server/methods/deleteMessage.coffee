Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		console.log '[methods] deleteMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		ChatMessage.remove
			_id: message._id
			'u._id': Meteor.userId()

		deleteMsgStream.emit message.rid, { _id: message._id }
