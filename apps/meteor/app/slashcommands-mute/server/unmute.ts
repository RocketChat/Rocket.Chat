import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';

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
				msg: TAPi18n.__('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await Meteor.callAsync('unmuteUserInRoom', {
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
