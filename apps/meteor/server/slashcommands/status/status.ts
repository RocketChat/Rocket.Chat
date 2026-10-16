import { api } from '@rocket.chat/core-services';
import { UserStatus, type SlashCommandCallbackParams, type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../lib/i18n';
import { slashCommands } from '../../lib/utils/slashCommand';
import { setUserStatusMethod } from '../../meteor-methods/users/setUserStatus';
import { settings } from '../../settings';

const executeSetUserStatus = async (
	userId: string | undefined,
	message: SlashCommandCallbackParams<string>['message'],
	statusType: IUser['status'] | undefined,
	statusText: string | undefined,
): Promise<void> => {
	if (!userId) {
		return;
	}

	const user = await Users.findOneById<
		Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'statusDefault' | 'roles' | 'statusText' | 'language'>
	>(userId, {
		projection: { language: 1, username: 1, name: 1, status: 1, statusDefault: 1, roles: 1, statusText: 1 },
	});
	const lng = user?.language || settings.get('Language') || 'en';

	if (!user) {
		return;
	}
	try {
		const allowMessageChange = settings.get('Accounts_AllowUserStatusMessageChange') ?? true;
		const normalizedStatusText =
			statusType !== undefined && !allowMessageChange && statusText === '' ? undefined : statusText;

		await setUserStatusMethod(user, statusType, normalizedStatusText);

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: i18n.t('StatusMessage_Changed_Successfully', { lng }),
		});
	} catch (err: any) {
		if (err.error === 'error-not-allowed') {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('StatusMessage_Change_Disabled', { lng }),
			});
		} else if (err.error === 'error-status-not-allowed') {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('error-status-not-allowed', { lng }),
			});
		}

		throw err;
	}
};

slashCommands.add({
	command: 'status',
	callback: async function Status({ params, message, userId }: SlashCommandCallbackParams<'status'>): Promise<void> {
		const trimmed = params?.trim() ?? '';
		const firstSpaceIndex = trimmed.indexOf(' ');
		const firstWord = (firstSpaceIndex === -1 ? trimmed : trimmed.slice(0, firstSpaceIndex)).toLowerCase();
		const remaining = firstSpaceIndex === -1 ? '' : trimmed.slice(firstSpaceIndex + 1).trim();

		let statusType: IUser['status'] | undefined;
		let statusText: string | undefined;

		switch (firstWord) {
			case 'online':
				statusType = UserStatus.ONLINE;
				statusText = remaining;
				break;
			case 'away':
				statusType = UserStatus.AWAY;
				statusText = remaining;
				break;
			case 'busy':
			case 'dnd':
				statusType = UserStatus.BUSY;
				statusText = remaining;
				break;
			case 'offline':
			case 'invisible':
				statusType = UserStatus.OFFLINE;
				statusText = remaining;
				break;
			default:
				statusType = undefined;
				statusText = params;
				break;
		}

		await executeSetUserStatus(userId, message, statusType, statusText);
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

slashCommands.add({
	command: 'away',
	callback: async function Away({ params, message, userId }: SlashCommandCallbackParams<'away'>): Promise<void> {
		await executeSetUserStatus(userId, message, UserStatus.AWAY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Away_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'busy',
	callback: async function Busy({ params, message, userId }: SlashCommandCallbackParams<'busy'>): Promise<void> {
		await executeSetUserStatus(userId, message, UserStatus.BUSY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Busy_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'dnd',
	callback: async function Dnd({ params, message, userId }: SlashCommandCallbackParams<'dnd'>): Promise<void> {
		await executeSetUserStatus(userId, message, UserStatus.BUSY, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Dnd_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'online',
	callback: async function Online({ params, message, userId }: SlashCommandCallbackParams<'online'>): Promise<void> {
		await executeSetUserStatus(userId, message, UserStatus.ONLINE, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Online_Description',
		params: 'your_message_optional',
	},
});

slashCommands.add({
	command: 'offline',
	callback: async function Offline({ params, message, userId }: SlashCommandCallbackParams<'offline'>): Promise<void> {
		await executeSetUserStatus(userId, message, UserStatus.OFFLINE, params?.trim() ?? '');
	},
	options: {
		description: 'Slash_Offline_Description',
		params: 'your_message_optional',
	},
});
