import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils/lib/slashCommand';
import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';

/*
 * Unmute is a named function that will replace /unmute commands
 */

slashCommands.add({
	command: 'unmute',
	callback: function Unmute(_command, params, item): void | Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const userId = Meteor.userId() as string;
		const unmutedUser = Users.findOneByUsernameIgnoringCase(username);
		if (unmutedUser == null) {
			return api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		Meteor.call('unmuteUserInRoom', {
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
