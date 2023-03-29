import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { Rooms } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { unarchiveRoom } from '../../lib/server';

slashCommands.add({
	command: 'unarchive',
	callback: async function Unarchive(_command: 'unarchive', params, item): Promise<void> {
		let channel = params.trim();
		let room;

		if (channel === '') {
			room = Rooms.findOneById(item.rid);
			channel = room.name;
		} else {
			channel = channel.replace('#', '');
			room = Rooms.findOneByName(channel);
		}

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
		if (!user || !isRegisterUser(user)) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		// You can not archive direct messages.
		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE, userId))) {
			return;
		}

		if (!room.archived) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_already_Unarchived', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await unarchiveRoom(room._id, user);

		void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Channel_Unarchived', {
				postProcess: 'sprintf',
				sprintf: [channel],
				lng: settings.get('Language') || 'en',
			}),
		});
	},
	options: {
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
});
