import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { slashCommands, APIClient } from '/app/utils';

// Track logins and when they login, get the commands
(() => {
	let oldUserId = null;

	Tracker.autorun(() => {
		const newUserId = Meteor.userId();
		if (oldUserId === null && newUserId) {
			APIClient.v1.get('commands.list').then(function _loadedCommands(result) {
				result.commands.forEach((command) => {
					slashCommands.commands[command.command] = command;
				});
			});
		}

		oldUserId = Meteor.userId();
	});
})();
