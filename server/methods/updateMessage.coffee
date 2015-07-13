Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] updateMessage -> Invalid user")

		console.log '[methods] updateMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		message.ets = new Date()

		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
			message.urls = urls

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		ChatMessage.update
			_id: message.id
			'u._id': Meteor.userId
		,
			$set: message

		Meteor.defer ->
			RocketChat.callbacks.run 'afterSaveMessage', ChatMessage.findOne(message.id)

	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		console.log '[methods] deleteMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		ChatMessage.remove
			_id: message.id
			'u._id': Meteor.userId
