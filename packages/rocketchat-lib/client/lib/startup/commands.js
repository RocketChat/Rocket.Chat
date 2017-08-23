Meteor.startup(function _loadDynamicallyDefinedCommands() {
	// The reason there is a 500 millisecond delay is so that we are
	// a little "easier" on the server during start up
	setTimeout(() => {
		RocketChat.API.v1.get('commands.list').then(function _loadedCommands(result) {
			result.commands.forEach((command) => {
				RocketChat.slashCommands.commands[command.command] = command;
			});
		});
	}, 500);
});
