import { Users } from '@rocket.chat/models';

export const normalizeExternalInviteeId = (rawInviteeId: string): string => `@${rawInviteeId.replace(/@/g, '')}`;

const validateExternalInviteeIdFormat = async (rawInviteeId: string, inviterId: string): Promise<void> => {
	const inviter = await Users.findOneById(inviterId);
	const isInviterExternal = inviter?.federated === true || inviter?.username?.includes(':');
	const localUserInvitingAnotherLocalUser = !rawInviteeId.includes(':') && !isInviterExternal;
	if (localUserInvitingAnotherLocalUser) {
		throw new Error('Invalid userId format for federation command.');
	}
};

export const executeSlashCommand = async (
	providedCommand: string,
	stringParams: string | undefined,
	item: Record<string, any>,
	commands: Record<string, (currentUserId: string, roomId: string, invitee: string) => Promise<void>>,
	currentUserId?: string | null,
): Promise<void> => {
	if (providedCommand !== 'federation' || !stringParams) {
		return;
	}

	const [command, ...params] = stringParams.trim().split(' ');
	const [rawUserId] = params;
	if (!currentUserId || !commands[command]) {
		return;
	}

	await validateExternalInviteeIdFormat(rawUserId, currentUserId);

	const invitee = normalizeExternalInviteeId(rawUserId);

	const { rid: roomId } = item;

	await commands[command](currentUserId, roomId, invitee);
};
