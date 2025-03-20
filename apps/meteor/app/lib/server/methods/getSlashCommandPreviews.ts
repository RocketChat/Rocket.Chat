import type { IMessage, RequiredField, SlashCommandPreviews } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../../utils/server/slashCommand';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSlashCommandPreviews(command: {
			cmd: string;
			params: string;
			msg: RequiredField<Partial<IMessage>, 'rid'>;
		}): SlashCommandPreviews | undefined;
	}
}

export const getSlashCommandPreviews = async (command: {
	cmd: string;
	params: string;
	msg: RequiredField<Partial<IMessage>, 'rid'>;
}): Promise<SlashCommandPreviews | undefined> => {
	if (!command?.cmd || !slashCommands.commands[command.cmd]) {
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
};

Meteor.methods<ServerMethods>({
	async getSlashCommandPreviews(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSlashCommandPreview',
			});
		}

		return getSlashCommandPreviews(command);
	},
});
