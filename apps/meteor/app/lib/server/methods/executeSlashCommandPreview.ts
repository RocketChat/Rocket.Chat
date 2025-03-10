import type { IMessage, RequiredField, SlashCommandPreviewItem } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../../utils/server/slashCommand';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		executeSlashCommandPreview(
			command: {
				cmd: string;
				params: string;
				msg: RequiredField<Partial<IMessage>, 'rid'>;
				triggerId?: string;
			},
			preview: SlashCommandPreviewItem,
		): void;
	}
}

export const executeSlashCommandPreview = async (
	command: {
		cmd: string;
		params: string;
		msg: RequiredField<Partial<IMessage>, 'rid'>;
		triggerId?: string;
	},
	preview: SlashCommandPreviewItem,
): Promise<void> => {
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

	if (!preview) {
		throw new Meteor.Error('error-invalid-command-preview', 'Invalid Preview Provided', {
			method: 'executeSlashCommandPreview',
		});
	}

	return slashCommands.executePreview(command.cmd, command.params, command.msg, preview, command.triggerId);
};

Meteor.methods<ServerMethods>({
	executeSlashCommandPreview(command, preview) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSlashCommandPreview',
			});
		}

		return executeSlashCommandPreview(command, preview);
	},
});
