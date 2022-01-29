import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings/server';
import { Rooms, Subscriptions } from '../../models/server';
import { slashCommands } from '../../utils/server';
import { api } from '../../../server/sdk/api';

/*
 * Hide is a named function that will replace /hide commands
 * @param {Object} message - The message object
 */

function Hide(_command: 'hide', param: string, item: Record<string, string>): void | Promise<void> {
	const room = param.trim();
	const user = Meteor.user();

	if (!user) {
		return;
	}
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
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [room],
					lng: settings.get('Language') || 'en',
				}),
			});
		}
		if (!Subscriptions.findOneByRoomIdAndUserId(roomObject._id, user._id, { fields: { _id: 1 } })) {
			return api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
				msg: TAPi18n.__('error-logged-user-not-in-room', {
					postProcess: 'sprintf',
					sprintf: [room],
					lng: settings.get('Language') || 'en',
				}),
			});
		}
		rid = roomObject._id;
	}
	Meteor.call('hideRoom', rid, (error: string) => {
		if (error) {
			return api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
				msg: TAPi18n.__(error, { lng: settings.get('Language') || 'en' }),
			});
		}
	});
}

slashCommands.add('hide', Hide, { description: 'Hide_room', params: '#room' }, undefined, false, undefined, undefined);
