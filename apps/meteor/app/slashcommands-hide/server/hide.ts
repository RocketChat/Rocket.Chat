import { api } from '@rocket.chat/core-services';
import type { IRoom, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { hideRoomMethod } from '../../../server/methods/hideRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

/*
 * Hide is a named function that will replace /hide commands
 * @param {Object} message - The message object
 */

slashCommands.add({
	command: 'hide',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'hide'>): Promise<void> => {
		const room = params.trim();
		if (!userId) {
			return;
		}

		const user = await Users.findOneById(userId);

		if (!user) {
			return;
		}

		const lng = user.language || settings.get('Language') || 'en';

		// if there is not a param, hide the current room
		let { rid } = message;
		if (room !== '') {
			const [strippedRoom] = room.replace(/#|@/, '').split(' ');

			const [type] = room;

			const roomObject: IRoom | null =
				type === '#'
					? await Rooms.findOneByName(strippedRoom)
					: await Rooms.findOne({
							t: 'd',
							usernames: { $all: [user.username, strippedRoom] },
					  });
			if (!roomObject) {
				void api.broadcast('notify.ephemeralMessage', user._id, message.rid, {
					msg: i18n.t('Channel_doesnt_exist', {
						postProcess: 'sprintf',
						sprintf: [room],
						lng,
					}),
				});
			}
			if (!(await Subscriptions.findOneByRoomIdAndUserId(roomObject ? roomObject._id : '', user._id, { projection: { _id: 1 } }))) {
				void api.broadcast('notify.ephemeralMessage', user._id, message.rid, {
					msg: i18n.t('error-logged-user-not-in-room', {
						postProcess: 'sprintf',
						sprintf: [room],
						lng,
					}),
				});
				return;
			}
			rid = roomObject?._id || message.rid;
		}
		try {
			await hideRoomMethod(userId, rid);
		} catch (error: any) {
			await api.broadcast('notify.ephemeralMessage', user._id, message.rid, {
				msg: i18n.t(error, { lng }),
			});
		}
	},
	options: { description: 'Hide_room', params: '#room' },
});
