import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../lib/slashCommand';

Meteor.methods<ServerMethods>({
	async slashCommand(command) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'slashCommand',
			});
		}

		if (!command?.cmd || !slashCommands.commands[command.cmd]) {
			throw new Meteor.Error('error-invalid-command', 'Invalid Command Provided', {
				method: 'executeSlashCommandPreview',
			});
		}

		return slashCommands.run({
			command: command.cmd,
			params: command.params,
			message: command.msg,
			triggerId: command.triggerId,
			userId,
		});
	},
});

export { slashCommands };
