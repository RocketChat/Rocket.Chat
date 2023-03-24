// Kick is a named function that will replace /kick commands
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';

import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'kick',
	callback: async (_command: 'kick', params, item): Promise<void> => {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const userId = Meteor.userId() as string;
		const user = Users.findOneById(userId);
		const lng = user?.language || settings.get('Language') || 'en';

		const kickedUser = Users.findOneByUsernameIgnoringCase(username);

		if (kickedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng,
				}),
			});
			return;
		}

		const { rid } = item;
		await Meteor.callAsync('removeUserFromRoom', { rid, username });
	},
	options: {
		description: 'Remove_someone_from_room',
		params: '@username',
		permission: 'remove-user',
	},
});
