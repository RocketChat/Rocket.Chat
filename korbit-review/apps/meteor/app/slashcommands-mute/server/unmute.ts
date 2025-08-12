import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { unmuteUserInRoom } from '../../../server/methods/unmuteUserInRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

/*
 * Unmute is a named function that will replace /unmute commands
 */

slashCommands.add({
	command: 'unmute',
	callback: async function Unmute({ params, message, userId }: SlashCommandCallbackParams<'unmute'>): Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const unmutedUser = await Users.findOneByUsernameIgnoringCase(username);
		if (unmutedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await unmuteUserInRoom(userId, {
			rid: message.rid,
			username,
		});
	},
	options: {
		description: 'Unmute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
