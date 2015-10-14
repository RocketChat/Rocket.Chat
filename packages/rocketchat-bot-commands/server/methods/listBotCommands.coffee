Meteor.methods
	listBotCommands: () ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addBotCommands -> Invalid user")

		console.log '[methods] listBotCommands -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()
		console.log RocketChat.botCommands.listCommands()
		return RocketChat.botCommands.listCommands()
