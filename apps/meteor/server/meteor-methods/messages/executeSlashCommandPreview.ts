import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, RequiredField, SlashCommandPreviewItem } from '@rocket.chat/core-typings';

import { slashCommands } from '../../lib/utils/slashCommand';

export const executeSlashCommandPreview = async (
	command: {
		cmd: string;
		params: string;
		msg: RequiredField<Partial<IMessage>, 'rid'>;
		triggerId?: string;
	},
	preview: SlashCommandPreviewItem,
	userId: string,
): Promise<void> => {
	if (!command?.cmd || !slashCommands.commands[command.cmd]) {
		throw new ClientSafeError('error-invalid-command', 'Invalid Command Provided', {
			method: 'executeSlashCommandPreview',
		});
	}

	const theCmd = slashCommands.commands[command.cmd];
	if (!theCmd.providesPreview) {
		throw new ClientSafeError('error-invalid-command', 'Command Does Not Provide Previews', {
			method: 'executeSlashCommandPreview',
		});
	}

	if (!preview) {
		throw new ClientSafeError('error-invalid-command-preview', 'Invalid Preview Provided', {
			method: 'executeSlashCommandPreview',
		});
	}

	return slashCommands.executePreview(command.cmd, command.params, command.msg, preview, userId, command.triggerId);
};
