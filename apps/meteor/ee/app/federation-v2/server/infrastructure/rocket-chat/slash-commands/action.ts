import { Users } from '@rocket.chat/models';

import { normalizeExternalInviteeId } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/slash-commands/action';

const validateInvitees = async (invitees: string[], inviterId: string): Promise<void> => {
	const atLeastOneExternal = invitees.some((invitee) => invitee.includes(':'));
	const inviter = await Users.findOneById(inviterId);
	const isInviterExternal = inviter?.federated === true || inviter?.username?.includes(':');
	if (!atLeastOneExternal && !isInviterExternal) {
		throw new Error('At least one user must be external');
	}
};

export const executeSlashCommand = async (
	providedCommand: string,
	stringParams: string | undefined,
	item: Record<string, any>,
	commands: Record<string, (currentUserId: string, roomId: string, invitees: string[]) => Promise<void>>,
	currentUserId?: string | null,
): Promise<void> => {
	if (providedCommand !== 'federation' || !stringParams) {
		return;
	}
	const [command, ...externalUserIdsToInvite] = stringParams.trim().split(' ');
	if (!currentUserId || !commands[command]) {
		return;
	}

	await validateInvitees(externalUserIdsToInvite, currentUserId);

	const invitees = externalUserIdsToInvite.map((rawUserId) => normalizeExternalInviteeId(rawUserId));

	const { rid: roomId } = item;

	await commands[command](currentUserId, roomId, invitees);
};
