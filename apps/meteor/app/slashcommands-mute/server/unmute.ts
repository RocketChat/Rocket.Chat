import { Meteor } from 'meteor/meteor';
import { Translation, api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';

/*
 * Unmute is a named function that will replace /unmute commands
 */

slashCommands.add({
	command: 'unmute',
	callback: async function Unmute(_command, params, item): Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const userId = Meteor.userId() as string;
		const unmutedUser = await Users.findOneByUsernameIgnoringCase(username);
		if (unmutedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: await Translation.translateText('Username_doesnt_exist', settings.get('Language') || 'en', {
					sprintf: [username],
				}),
			});
			return;
		}

		await Meteor.callAsync('unmuteUserInRoom', {
			rid: item.rid,
			username,
		});
	},
	options: {
		description: 'Unmute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
