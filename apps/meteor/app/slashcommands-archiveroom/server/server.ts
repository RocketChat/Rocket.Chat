import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { i18n } from '../../../server/lib/i18n';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { archiveRoom } from '../../lib/server/functions/archiveRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

slashCommands.add({
	command: 'archive',
	callback: async function Archive({ params, message, userId }: SlashCommandCallbackParams<'archive'>): Promise<void> {
		let channel = params.trim();

		let room;

		if (channel === '') {
			room = await Rooms.findOneById(message.rid);
			if (room?.name) {
				channel = room.name;
			}
		} else {
			channel = channel.replace('#', '');
			room = await Rooms.findOneByName(channel);
		}

		if (!userId) {
			return;
		}

		const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
		if (!user || !isRegisterUser(user)) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE, userId))) {
			throw new Meteor.Error('error-room-type-not-archivable', `Room type: ${room.t} can not be archived`);
		}

		if (!(await hasPermissionAsync(userId, 'archive-room', room._id))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized');
		}

		if (room.archived) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Duplicate_archived_channel_name', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await archiveRoom(room._id, user);

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: i18n.t('Channel_Archived', {
				postProcess: 'sprintf',
				sprintf: [channel],
				lng: settings.get('Language') || 'en',
			}),
		});
	},
	options: {
		description: 'Archive',
		params: '#channel',
		permission: 'archive-room',
	},
});
