import { Federation } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../../../../../app/utils/server/slashCommand';
import { executeSlashCommand } from './action';

const FEDERATION_COMMANDS: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		Federation.createDirectMessageRoomAndInviteUser(currentUserId, roomId, invitee),
};

async function federation({ command, params, message, userId }: SlashCommandCallbackParams<'federation'>): Promise<void> {
	await executeSlashCommand(command, params, message, FEDERATION_COMMANDS, userId);
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
});
