import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils';
import { Users, Subscriptions } from '../../models';
import { api } from '../../../server/sdk/api';

/*
* Mute is a named function that will replace /mute commands
*/

slashCommands.add('mute', function Mute(command, params, item) {
	if (command !== 'mute' || !Match.test(params, String)) {
		return;
	}
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const userId = Meteor.userId();
	const user = Meteor.users.findOne(userId);
	const mutedUser = Users.findOneByUsernameIgnoringCase(username);
	if (mutedUser == null) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
		return;
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, mutedUser._id, { fields: { _id: 1 } });
	if (!subscription) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
		return;
	}
	Meteor.call('muteUserInRoom', {
		rid: item.rid,
		username,
	});
}, {
	description: 'Mute_someone_in_room',
	params: '@username',
	permission: 'mute-user',
});
