// Kick is a named function that will replace /kick commands
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Users, Subscriptions } from '../../models/server';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { api } from '../../../server/sdk/api';

const Kick = function (_command: 'kick', params: string, item: Record<string, string>): void | Promise<void> {
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const userId = Meteor.userId() as string;
	const kickedUser = Users.findOneByUsernameIgnoringCase(username);

	if (kickedUser == null) {
		return api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username],
				lng: settings.get('Language') || 'en',
			}),
		});
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, userId, {
		fields: { _id: 1 },
	});
	if (!subscription) {
		return api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username],
				lng: settings.get('Language') || 'en',
			}),
		});
	}
	const { rid } = item;
	Meteor.call('removeUserFromRoom', { rid, username });
};

slashCommands.add(
	'kick',
	Kick,
	{
		description: 'Remove_someone_from_room',
		params: '@username',
		permission: 'remove-user',
	},
	undefined,
	false,
	undefined,
	undefined,
);
