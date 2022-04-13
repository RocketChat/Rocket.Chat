import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Subscriptions } from '../../models';
import { slashCommands } from '../../utils';
import { api } from '../../../server/sdk/api';

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

		const roomObject =
			type === '#'
				? Rooms.findOneByName(strippedRoom)
				: Rooms.findOne({
						t: 'd',
						usernames: { $all: [user.username, strippedRoom] },
				  });

		if (!roomObject) {
			api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
				msg: TAPi18n.__(
					'Channel_doesnt_exist',
					{
						postProcess: 'sprintf',
						sprintf: [room],
					},
					user.language,
				),
			});
		}

		if (!Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { fields: { _id: 1 } })) {
			return api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
				msg: TAPi18n.__(
					'error-logged-user-not-in-room',
					{
						postProcess: 'sprintf',
						sprintf: [room],
					},
					user.language,
				),
			});
		}
		rid = roomObject._id;
	}

	Meteor.call('hideRoom', rid, (error) => {
		if (error) {
			return api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
				msg: TAPi18n.__(error, null, user.language),
			});
		}
	});
}

slashCommands.add('hide', Hide, { description: 'Hide_room', params: '#room' });
