import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { slashCommands } from 'meteor/rocketchat:utils';
import { Users, Subscriptions } from 'meteor/rocketchat:models';
import { Notifications } from 'meteor/rocketchat:notifications';

/*
* Unmute is a named function that will replace /unmute commands
*/

slashCommands.add('unmute', function Unmute(command, params, item) {

	if (command !== 'unmute' || !Match.test(params, String)) {
		return;
	}
	const username = params.trim().replace('@', '');
	if (username === '') {
		return;
	}
	const user = Meteor.users.findOne(Meteor.userId());
	const unmutedUser = Users.findOneByUsername(username);
	if (unmutedUser == null) {
		return Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
	}

	const subscription = Subscriptions.findOneByRoomIdAndUserId(item.rid, unmutedUser._id, { fields: { _id: 1 } });
	if (!subscription) {
		return Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Username_is_not_in_this_room', {
				postProcess: 'sprintf',
				sprintf: [username],
			}, user.language),
		});
	}
	Meteor.call('unmuteUserInRoom', {
		rid: item.rid,
		username,
	});
}, {
	description: 'Unmute_someone_in_room',
	params: '@username',
});
