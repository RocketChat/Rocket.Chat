RocketChat.slashCommands =
	commands: {}

RocketChat.slashCommands.add = (command, callback, options) ->
	RocketChat.slashCommands.commands[command] =
		command: command
		callback: callback
		params: options?.params
		description: options?.description

	return

RocketChat.slashCommands.run = (command, params, item) ->
	if RocketChat.slashCommands.commands[command]?.callback?
		callback = RocketChat.slashCommands.commands[command].callback
		callback command, params, item


Meteor.methods
	slashCommand: (command) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'slashCommand' }

		RocketChat.slashCommands.run command.cmd, command.params, command.msg

