Meteor.methods
	botAutoComplete: (commands) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] joinDefaultChannels -> Invalid user")

		console.log '[methods] AUTO COMPLETE -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		user = Meteor.user()

		console.log 'Commands ======>', commands

		for command in commands.commands
			console.log "test"
			RocketChat.botAutoComplete.addCommand command
