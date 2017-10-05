RocketChat.slashCommands = {
	commands: {}
};

RocketChat.slashCommands.add = function(command, callback, options = {}, result) {
	RocketChat.slashCommands.commands[command] = {
		command,
		callback,
		params: options.params,
		description: options.description,
		clientOnly: options.clientOnly || false,
		result
	};
};

RocketChat.slashCommands.run = function(command, params, item) {
	if (RocketChat.slashCommands.commands[command] && RocketChat.slashCommands.commands[command].callback) {
		return RocketChat.slashCommands.commands[command].callback(command, params, item);
	}
};

Meteor.methods({
	slashCommand(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'slashCommand'
			});
		}
		return RocketChat.slashCommands.run(command.cmd, command.params, command.msg);
	}
});
