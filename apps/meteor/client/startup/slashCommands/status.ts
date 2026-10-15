import { UserStatus, type SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../lib/SDKClient';
import { slashCommands } from '../../lib/slashCommand';
import { dispatchToastMessage } from '../../lib/toast';

const setUserStatusClient = async (status?: UserStatus, message?: string) => {
	try {
		await sdk.rest.post('/v1/users.setStatus', {
			...(status && { status }),
			message: message ?? '',
		});
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
	}
};

slashCommands.add({
	command: 'status',
	callback: async function Status({ params, userId }: SlashCommandCallbackParams<'status'>): Promise<void> {
		if (!userId) {
			return;
		}

		const trimmed = params?.trim() ?? '';
		const firstSpaceIndex = trimmed.indexOf(' ');
		const firstWord = (firstSpaceIndex === -1 ? trimmed : trimmed.slice(0, firstSpaceIndex)).toLowerCase();
		const remaining = firstSpaceIndex === -1 ? '' : trimmed.slice(firstSpaceIndex + 1).trim();

		let status: UserStatus | undefined;
		let message: string | undefined = params;

		switch (firstWord) {
			case 'online':
				status = UserStatus.ONLINE;
				message = remaining;
				break;
			case 'away':
				status = UserStatus.AWAY;
				message = remaining;
				break;
			case 'busy':
			case 'dnd':
				status = UserStatus.BUSY;
				message = remaining;
				break;
			case 'offline':
			case 'invisible':
				status = UserStatus.OFFLINE;
				message = remaining;
				break;
			default:
				status = undefined;
				message = params;
				break;
		}

		await setUserStatusClient(status, message);
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

slashCommands.add({
	command: 'away',
	callback: async function Away({ params, userId }: SlashCommandCallbackParams<'away'>): Promise<void> {
		if (!userId) {
			return;
		}
		await setUserStatusClient(UserStatus.AWAY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Away_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'busy',
	callback: async function Busy({ params, userId }: SlashCommandCallbackParams<'busy'>): Promise<void> {
		if (!userId) {
			return;
		}
		await setUserStatusClient(UserStatus.BUSY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Busy_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'dnd',
	callback: async function Dnd({ params, userId }: SlashCommandCallbackParams<'dnd'>): Promise<void> {
		if (!userId) {
			return;
		}
		await setUserStatusClient(UserStatus.BUSY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Dnd_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'online',
	callback: async function Online({ params, userId }: SlashCommandCallbackParams<'online'>): Promise<void> {
		if (!userId) {
			return;
		}
		await setUserStatusClient(UserStatus.ONLINE, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Online_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'offline',
	callback: async function Offline({ params, userId }: SlashCommandCallbackParams<'offline'>): Promise<void> {
		if (!userId) {
			return;
		}
		await setUserStatusClient(UserStatus.OFFLINE, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Offline_Description',
		params: 'your_message_optional',
	},
});
