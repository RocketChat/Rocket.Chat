
// Kick is a named function that will replace /kick commands
import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { Notifications } from '../../notifications';
import { Users, Subscriptions } from '../../models';
import { slashCommands } from '../../utils';

const Kick = function(command, params, { rid }) {
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
		return Notifications.notifyUser(userId, 'message', {
			_id: Random.id(),
			rid,
			ts: new Date,
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id, { fields: { _id: 1 } });
	if (!subscription) {
		return Notifications.notifyUser(userId, 'message', {
			_id: Random.id(),
			rid,
			ts: new Date,
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
	}
	Meteor.call('removeUserFromRoom', { rid, username });
};

slashCommands.add('kick', Kick, {
	description: 'Remove_someone_from_room',
	params: '@username',
	permission: 'remove-user',
});
