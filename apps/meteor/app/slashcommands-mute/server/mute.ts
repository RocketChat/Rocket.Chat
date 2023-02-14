import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { Users } from '../../models/server';
import { api } from '../../../server/sdk/api';

/*
 * Mute is a named function that will replace /mute commands
 */

slashCommands.add({
	command: 'mute',
	callback: function Mute(_command: 'mute', params, item): void {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}

		const userId = Meteor.userId() as string;
		const mutedUser = Users.findOneByUsernameIgnoringCase(username);
		if (mutedUser == null) {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		Meteor.call('muteUserInRoom', {
			rid: item.rid,
			username,
		});
	},
	options: {
		description: 'Mute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
