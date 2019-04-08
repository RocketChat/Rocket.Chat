
/*
* Join is a named function that will replace /join commands
* @param {Object} message - The message object
*/
import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.slashCommands.add('join', function Join(command, params, item) {

	if (command !== 'join' || !Match.test(params, String)) {
		return;
	}
	let channel = params.trim();
	if (channel === '') {
		return;
	}
	channel = channel.replace('#', '');
	const user = Meteor.users.findOne(Meteor.userId());
	const room = RocketChat.models.Rooms.findOneByNameAndType(channel, 'c');
	if (!room) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date,
			msg: TAPi18n.__('Channel_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [channel],
			}, user.language),
		});
	}

	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { fields: { _id: 1 } });
	if (subscription) {
		throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
			method: 'slashCommands',
		});
	}
	Meteor.call('joinRoom', room._id);
}, {
	description: 'Join_the_given_channel',
	params: '#channel',
});
