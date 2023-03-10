import type { IMessage, SlashCommandPreviews } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../../utils/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSlashCommandPreviews(command: { cmd: string; params: string; msg: Pick<IMessage, 'rid' | 'tmid'> }): Promise<SlashCommandPreviews>;
	}
}

Meteor.methods({
	getSlashCommandPreviews(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSlashCommandPreview',
			});
		}

		if (!command || !command.cmd || !slashCommands.commands[command.cmd]) {
			throw new Meteor.Error('error-invalid-command', 'Invalid Command Provided', {
				method: 'executeSlashCommandPreview',
			});
		}

		const theCmd = slashCommands.commands[command.cmd];
		if (!theCmd.providesPreview) {
			throw new Meteor.Error('error-invalid-command', 'Command Does Not Provide Previews', {
				method: 'executeSlashCommandPreview',
			});
		}

		return slashCommands.getPreviews(command.cmd, command.params, command.msg);
	},
});
