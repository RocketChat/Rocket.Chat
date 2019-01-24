import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

/*
* Hide is a named function that will replace /hide commands
* @param {Object} message - The message object
*/
function Hide(command, param, item) {
	if (command !== 'hide' || !Match.test(param, String)) {
		return;
	}
	const room = param.trim();
	const user = Meteor.user();
	// if there is not a param, hide the current room
	let { rid } = item;
	if (room !== '') {
		const [strippedRoom] = room.replace(/#|@/, '').split(' ');
		const [type] = room;

		const roomObject = type === '#' ? RocketChat.models.Rooms.findOneByName(strippedRoom) : RocketChat.models.Rooms.findOne({
			t: 'd',
			usernames: { $all: [user.username, strippedRoom] },
		});

		if (!roomObject) {
			return RocketChat.Notifications.notifyUser(user._id, 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [room],
				}, user.language),
			});
		}

		if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { fields: { _id: 1 } })) {
			return RocketChat.Notifications.notifyUser(user._id, 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__('error-logged-user-not-in-room', {
					postProcess: 'sprintf',
					sprintf: [room],
				}, user.language),
			});
		}
		rid = roomObject._id;
	}

	Meteor.call('hideRoom', rid, (error) => {
		if (error) {
			return RocketChat.Notifications.notifyUser(user._id, 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date,
				msg: TAPi18n.__(error, null, user.language),
			});
		}
	});
}

RocketChat.slashCommands.add('hide', Hide, { description: 'Hide_room', params: '#room' });
