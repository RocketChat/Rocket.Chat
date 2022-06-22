import { Meteor } from 'meteor/meteor';

import { federationRoomServiceSender } from '../../..';
import { FederationRoomSenderConverter } from '../converters/RoomSender';
import { slashCommands } from '../../../../../utils/lib/slashCommand';

export const FEDERATION_COMMANDS: Record<string, Function> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		federationRoomServiceSender.createDirectMessageRoomAndInviteUser(
			FederationRoomSenderConverter.toCreateDirectMessageRoomDto(currentUserId, roomId, invitee),
		),
};

export const normalizeUserId = (rawUserId: string): string => `@${rawUserId.replace('@', '')}`;
export const validateUserIdFormat = (rawUserId: string) => {
	if (!rawUserId.includes(':')) {
		throw new Error('Invalid userId format for federation command.');
	}
};

export const executeSlashCommand = async (
	providedCommand: string,
	stringParams: string | undefined,
	item: Record<string, any>,
	commands: Record<string, Function>,
): Promise<void> => {
	if (providedCommand !== 'federation' || !stringParams) {
		return;
	}

	const [command, ...params] = stringParams.split(' ');
	const [rawUserId] = params;
	validateUserIdFormat(rawUserId);

	const currentUserId = Meteor.userId();
	const invitee = normalizeUserId(rawUserId);

	const { rid: roomId } = item;

	if (!currentUserId || !commands[command]) {
		return;
	}

	await commands[command](currentUserId, roomId, invitee);
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, FEDERATION_COMMANDS));
}

slashCommands.add('federation', federation, {
	description: 'Federation_slash_commands',
	params: '#command (dm) #user',
});
