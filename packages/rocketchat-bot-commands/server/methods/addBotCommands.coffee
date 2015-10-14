Meteor.methods
	addBotCommands: (commands) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] addBotCommands -> Invalid user")

		console.log '[methods] addBotCommands -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		console.log 'Commands ======>', commands

		for command in commands.commands
			RocketChat.botCommands.addCommand command
