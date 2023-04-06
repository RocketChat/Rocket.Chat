import { Meteor } from 'meteor/meteor';
import { Federation } from '@rocket.chat/core-services';

import { executeSlashCommand } from './action';
import { slashCommands } from '../../../../../../app/utils/server';

const FEDERATION_COMMANDS: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		Federation.createDirectMessageRoomAndInviteUser(currentUserId, roomId, invitee),
};

<<<<<<< HEAD
function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, FEDERATION_COMMANDS, Meteor.userId()));
=======
async function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): Promise<void> {
	await executeSlashCommand(providedCommand, stringParams, item, FEDERATION_COMMANDS, Meteor.userId());
>>>>>>> develop
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
});
