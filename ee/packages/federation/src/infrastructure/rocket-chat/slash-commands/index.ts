import { Federation } from '@rocket.chat/core-services';
import type { ISlashCommands, SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { executeDefaultSlashCommand, executeEESlashCommand } from './action';

const FEDERATION_COMMANDS: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		Federation.createDirectMessageRoomAndInviteUser(currentUserId, roomId, invitee),
};

async function defaultFederationAction({ command, params, message, userId }: SlashCommandCallbackParams<'federation'>): Promise<void> {
	await executeDefaultSlashCommand(command, params, message, FEDERATION_COMMANDS, userId);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const addDefaultFederationSlashCommand = (slashCommands: ISlashCommands): void => {
	slashCommands.remove('federation');
	slashCommands.add({
		command: 'federation',
		callback: defaultFederationAction,
		options: {
			description: 'Federation_slash_commands',
			params: '#command (dm) #user',
		},
	});
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const addDMMultipleFederationSlashCommand = (slashCommands: ISlashCommands): void => {
	slashCommands.remove('federation');
	slashCommands.add({
		command: 'federation',
		callback: eeFederationCommand,
		options: {
			description: 'Federation_slash_commands',
			params: '#command (dm) #users',
		},
	});
};

const EE_FEDERATION_COMMANDS = {
	dm: async (currentUserId: string, _: string, invitees: string[]): Promise<void> =>
		Federation.createDirectMessageRoom(currentUserId, invitees),
};

async function eeFederationCommand({ command, params, message, userId }: SlashCommandCallbackParams<'federation'>): Promise<void> {
	return executeEESlashCommand(command, params, message, EE_FEDERATION_COMMANDS, userId);
}
