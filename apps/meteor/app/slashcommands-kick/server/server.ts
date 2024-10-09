// Kick is a named function that will replace /kick commands
import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { removeUserFromRoomMethod } from '../../../server/methods/removeUserFromRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

slashCommands.add({
	command: 'kick',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'kick'>): Promise<void> => {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const user = await Users.findOneById(userId);
		const lng = user?.language || settings.get('Language') || 'en';

		const kickedUser = await Users.findOneByUsernameIgnoringCase(username);

		if (kickedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng,
				}),
			});
			return;
		}

		const { rid } = message;

		await removeUserFromRoomMethod(userId, { rid, username });
	},
	options: {
		description: 'Remove_someone_from_room',
		params: '@username',
		permission: 'remove-user',
	},
});
