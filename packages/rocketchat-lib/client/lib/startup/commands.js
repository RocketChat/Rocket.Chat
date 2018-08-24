//Track logins and when they login, get the commands
(() => {
	let oldUserId = null;

	Meteor.autorun(() => {
		const newUserId = Meteor.userId();
		if (oldUserId === null && newUserId) {
			RocketChat.API.v1.get('commands.list').then(function _loadedCommands(result) {
				result.commands.forEach((command) => {
					RocketChat.slashCommands.commands[command.command] = command;
				});
			});
		}

		oldUserId = Meteor.userId();
	});
})();
