import { Meteor } from 'meteor/meteor';

import { federationRoomServiceSender } from '../../..';
import { FederationRoomSenderConverter } from '../converters/RoomSender';
import { slashCommands } from '../../../../../utils/lib/slashCommand';
import { executeSlashCommand } from './action';

const FEDERATION_COMMANDS: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		federationRoomServiceSender.createDirectMessageRoomAndInviteUser(
			FederationRoomSenderConverter.toCreateDirectMessageRoomDto(currentUserId, roomId, invitee),
		),
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, FEDERATION_COMMANDS, Meteor.userId()));
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
});
