RocketChat.slashCommands = {}

RocketChat.slashCommands.add = (command, callback) ->
	if !RocketChat.slashCommands[command]?
		RocketChat.slashCommands[command] = callback
	return

RocketChat.slashCommands.run = (command, params, item) ->
	if RocketChat.slashCommands[command]?
		callback = RocketChat.slashCommands[command]
		callback command, params, item


Meteor.methods
	slashCommand: (command) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		RocketChat.slashCommands.run command.cmd, command.params, command.msg

