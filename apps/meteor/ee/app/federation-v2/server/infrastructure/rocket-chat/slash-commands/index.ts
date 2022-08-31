import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../../../../../../app/utils/lib/slashCommand';
import { federationRoomServiceSenderEE } from '../../..';
import { FederationRoomSenderConverterEE } from '../converters/RoomSender';
import { executeSlashCommand } from './action';

const EE_FEDERATION_COMMANDS = {
	dm: async (currentUserId: string, _: string, invitees: string[]): Promise<void> =>
		federationRoomServiceSenderEE.createLocalDirectMessageRoom(
			FederationRoomSenderConverterEE.toCreateDirectMessageDto(currentUserId, invitees),
		),
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, EE_FEDERATION_COMMANDS, Meteor.userId()));
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #users',
	},
});
