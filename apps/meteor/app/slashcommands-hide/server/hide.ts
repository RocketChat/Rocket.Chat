import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { Rooms, Users } from '../../models/server';
import { slashCommands } from '../../utils/server';

/*
 * Hide is a named function that will replace /hide commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'hide',
	callback: async (_command: 'hide', param, item): Promise<void> => {
		const room = param.trim();
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}

		const user = Users.findOneById(userId);

		if (!user) {
			return;
		}

		const lng = user.language || settings.get('Language') || 'en';

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
				void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
					msg: TAPi18n.__('Channel_doesnt_exist', {
						postProcess: 'sprintf',
						sprintf: [room],
						lng,
					}),
				});
			}
			if (!(await Subscriptions.findOneByRoomIdAndUserId(roomObject._id, user._id, { projection: { _id: 1 } }))) {
				void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
					msg: TAPi18n.__('error-logged-user-not-in-room', {
						postProcess: 'sprintf',
						sprintf: [room],
						lng,
					}),
				});
				return;
			}
			rid = roomObject._id;
		}
		await Meteor.callAsync('hideRoom', rid, (error: string) => {
			if (error) {
				return api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
					msg: TAPi18n.__(error, { lng }),
				});
			}
		});
	},
	options: { description: 'Hide_room', params: '#room' },
});
