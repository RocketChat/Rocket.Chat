import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { slashCommands } from 'meteor/rocketchat:utils';

// Track logins and when they login, get the commands
(() => {
	let oldUserId = null;

	Tracker.autorun(() => {
		const newUserId = Meteor.userId();
		if (oldUserId === null && newUserId) {
			import('meteor/rocketchat:api').then(({ API }) => {
				API.v1.get('commands.list').then(function _loadedCommands(result) {
					result.commands.forEach((command) => {
						slashCommands.commands[command.command] = command;
					});
				});
			});
		}

		oldUserId = Meteor.userId();
	});
})();
