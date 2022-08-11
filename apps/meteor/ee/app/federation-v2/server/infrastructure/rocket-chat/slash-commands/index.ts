import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';

import { slashCommands } from '../../../../../../../app/utils/lib/slashCommand';
import { federationRoomServiceSenderEE } from '../../..';
import { normalizeUserId } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/slash-commands';
import { FederationRoomSenderConverterEE } from '../converters/RoomSender';

const EE_FEDERATION_COMMANDS = {
	dm: async (currentUserId: string, _: string, invitees: string[]): Promise<void> =>
		federationRoomServiceSenderEE.createLocalDirectMessageRoom(
			FederationRoomSenderConverterEE.toCreateDirectMessageDto(currentUserId, invitees),
		),
};

const validateInvitees = async (invitees: string[], inviterId: string): Promise<void> => {
	const atLeastOneExternal = invitees.some((invitee) => invitee.includes(':'));
	const inviter = await Users.findOneById(inviterId);
	const isInviterExternal = inviter?.federated === true || inviter?.username?.includes(':');
	if (!atLeastOneExternal && !isInviterExternal) {
		throw new Error('At least one user must be external');
	}
};

const executeSlashCommand = async (
	providedCommand: string,
	stringParams: string | undefined,
	item: Record<string, any>,
	commands: Record<string, (currentUserId: string, roomId: string, invitees: string[]) => void>,
): Promise<void> => {
	if (providedCommand !== 'federation' || !stringParams) {
		return;
	}
	const currentUserId = Meteor.userId();
	const [command, ...externalUserIdsToInvite] = stringParams.trim().split(' ');
	if (!currentUserId || !commands[command]) {
		return;
	}

	await validateInvitees(externalUserIdsToInvite, currentUserId);

	const invitees = externalUserIdsToInvite.map((rawUserId) => normalizeUserId(rawUserId));

	const { rid: roomId } = item;

	await commands[command](currentUserId, roomId, invitees);
};

function federation(providedCommand: string, stringParams: string | undefined, item: Record<string, any>): void {
	Promise.await(executeSlashCommand(providedCommand, stringParams, item, EE_FEDERATION_COMMANDS));
}

slashCommands.add({
	command: 'federation',
	callback: federation,
	options: {
		description: 'Federation_slash_commands',
		params: '#command (dm, setup-room, invite) #user',
	},
});
