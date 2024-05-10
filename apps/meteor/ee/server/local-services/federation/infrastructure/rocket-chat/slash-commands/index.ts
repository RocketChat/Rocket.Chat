import { FederationEE } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../../../../../../app/utils/server/slashCommand';
import { executeSlashCommand } from './action';

const EE_FEDERATION_COMMANDS = {
	dm: async (currentUserId: string, _: string, invitees: string[]): Promise<void> =>
		FederationEE.createDirectMessageRoom(currentUserId, invitees),
};

function federation({ command, params, message, userId }: SlashCommandCallbackParams<'federation'>): Promise<void> {
	return executeSlashCommand(command, params, message, EE_FEDERATION_COMMANDS, userId);
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #users',
	},
});
