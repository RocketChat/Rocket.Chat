import { Meteor } from 'meteor/meteor';
import { slashCommands } from 'meteor/rocketchat:utils';

RocketChat.slashCommands = slashCommands;

Meteor.methods({
	slashCommand(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'slashCommand',
			});
		}

		if (!command || !command.cmd || !RocketChat.slashCommands.commands[command.cmd]) {
			throw new Meteor.Error('error-invalid-command', 'Invalid Command Provided', {
				method: 'executeSlashCommandPreview',
			});
		}

		return RocketChat.slashCommands.run(command.cmd, command.params, command.msg);
	},
});
