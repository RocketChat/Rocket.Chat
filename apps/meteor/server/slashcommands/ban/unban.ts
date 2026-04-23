import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { sanitizeUsername } from '../../../app/lib/server/methods/addUsersToRoom';
import { settings } from '../../../app/settings/server';
import { slashCommands } from '../../../app/utils/server/slashCommand';
import { i18n } from '../../lib/i18n';
import { unbanUserFromRoom } from '../../lib/unbanUserFromRoom';

slashCommands.add({
	command: 'unban',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'unban'>): Promise<void> => {
		const username = sanitizeUsername(params.trim());

		if (!username) {
			return;
		}

		const user = await Users.findOneByUsernameIgnoringCase(username);
		if (!user) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await unbanUserFromRoom(userId, { rid: message.rid, username });
	},
	options: {
		description: 'Unban_user_from_room',
		params: '@username',
		permission: 'ban-user',
	},
});
