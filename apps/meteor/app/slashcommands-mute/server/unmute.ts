import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { Users, Subscriptions } from '../../models/server';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';

/*
 * Unmute is a named function that will replace /unmute commands
 */

function Unmute(_command: 'unmute', params: string, item: IMessage): void | Promise<void> {
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

	const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, unmutedUser._id, {
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
	Meteor.call('unmuteUserInRoom', {
		rid: item.rid,
		username,
	});
}

slashCommands.add('unmute', Unmute, {
	description: 'Unmute_someone_in_room',
	params: '@username',
	permission: 'mute-user',
});
