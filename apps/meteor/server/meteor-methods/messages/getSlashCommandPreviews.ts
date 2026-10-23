import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, RequiredField, SlashCommandPreviews } from '@rocket.chat/core-typings';

import { slashCommands } from '../../lib/utils/slashCommand';

export const getSlashCommandPreviews = async (command: {
	cmd: string;
	params: string;
	msg: RequiredField<Partial<IMessage>, 'rid'>;
	userId: string;
}): Promise<SlashCommandPreviews | undefined> => {
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

	return slashCommands.getPreviews(command.cmd, command.params, command.msg, command.userId);
};
