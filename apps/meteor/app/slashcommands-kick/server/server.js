// Kick is a named function that will replace /kick commands
import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Users, Subscriptions } from '../../models';
import { slashCommands } from '../../utils';
import { api } from '../../../server/sdk/api';

const Kick = function (command, params, { rid }) {
	if (command !== 'kick' || !Match.test(params, String)) {
		return;
	}
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const userId = Meteor.userId();
	const user = Meteor.users.findOne(userId);
	const kickedUser = Users.findOneByUsernameIgnoringCase(username);

	if (kickedUser == null) {
		return api.broadcast('notify.ephemeralMessage', userId, rid, {
			msg: TAPi18n.__(
				'Username_doesnt_exist',
				{
					postProcess: 'sprintf',
					sprintf: [username],
				},
				user.language,
			),
		});
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id, {
		fields: { _id: 1 },
	});
	if (!subscription) {
		return api.broadcast('notify.ephemeralMessage', userId, rid, {
			msg: TAPi18n.__(
				'Username_is_not_in_this_room',
				{
					postProcess: 'sprintf',
					sprintf: [username],
				},
				user.language,
			),
		});
	}
	Meteor.call('removeUserFromRoom', { rid, username });
};

slashCommands.add('kick', Kick, {
	description: 'Remove_someone_from_room',
	params: '@username',
	permission: 'remove-user',
});
