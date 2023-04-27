import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';

/*
 * Mute is a named function that will replace /mute commands
 */

slashCommands.add({
	command: 'mute',
	callback: async function Mute({ params, message, userId }: SlashCommandCallbackParams<'mute'>): Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}

		const mutedUser = await Users.findOneByUsernameIgnoringCase(username);
		if (mutedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: TAPi18n.__('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		await Meteor.callAsync('muteUserInRoom', {
			rid: message.rid,
			username,
		});
	},
	options: {
		description: 'Mute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
