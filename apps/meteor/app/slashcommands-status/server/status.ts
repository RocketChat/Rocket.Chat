import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';
import { setUserStatusMethod } from '../../user-status/server/methods/setUserStatus';
import { slashCommands } from '../../utils/server/slashCommand';

slashCommands.add({
	command: 'status',
	callback: async function Status({ params, message, userId }: SlashCommandCallbackParams<'status'>): Promise<void> {
		if (!userId) {
			return;
		}

		const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText' | 'language'>>(
			userId,
			{
				projection: { language: 1, username: 1, name: 1, status: 1, roles: 1, statusText: 1 },
			},
		);
		const lng = user?.language || settings.get('Language') || 'en';

		if (!user) {
			return;
		}
		try {
			await setUserStatusMethod(user, undefined, params);

			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('StatusMessage_Changed_Successfully', { lng }),
			});
		} catch (err: any) {
			if (err.error === 'error-not-allowed') {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: i18n.t('StatusMessage_Change_Disabled', { lng }),
				});
			}

			throw err;
		}
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});
