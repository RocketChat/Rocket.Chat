import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';

import { federationRoomServiceSender } from '../../..';
import { FederationRoomSenderConverter } from '../converters/RoomSender';
import { slashCommands } from '../../../../../utils/lib/slashCommand';

const FEDERATION_COMMANDS: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>> = {
	dm: async (currentUserId: string, roomId: string, invitee: string) =>
		federationRoomServiceSender.createDirectMessageRoomAndInviteUser(
			FederationRoomSenderConverter.toCreateDirectMessageRoomDto(currentUserId, roomId, invitee),
		),
};

export const normalizeUserId = (rawUserId: string): string => `@${rawUserId.replace('@', '')}`;

const validateUserIdFormat = async (rawUserId: string, inviterId: string): Promise<void> => {
	const inviter = await Users.findOneById(inviterId);
	const isInviterExternal = inviter?.federated === true || inviter?.username?.includes(':');
	if (!rawUserId.includes(':') && !isInviterExternal) {
		throw new Error('Invalid userId format for federation command.');
	}
};

const executeSlashCommand = async (
	providedCommand: string,
	stringParams: string | undefined,
	item: Record<string, any>,
	commands: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>>,
): Promise<void> => {
	if (providedCommand !== 'federation' || !stringParams) {
		return;
	}

	const [command, ...params] = stringParams.trim().split(' ');
	const [rawUserId] = params;
	const currentUserId = Meteor.userId();
	if (!currentUserId || !commands[command]) {
		return;
	}

	await validateUserIdFormat(rawUserId, currentUserId);

	const invitee = normalizeUserId(rawUserId);

	const { rid: roomId } = item;

	await commands[command](currentUserId, roomId, invitee);
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, FEDERATION_COMMANDS));
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm) #user',
	},
});
