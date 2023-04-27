import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { api } from '@rocket.chat/core-services';
import { Users, Rooms } from '@rocket.chat/models';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { archiveRoom } from '../../lib/server/functions/archiveRoom';

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
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		// You can not archive direct messages.
		if (room.t === 'd') {
			return;
		}

		if (room.archived) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: TAPi18n.__('Duplicate_archived_channel_name', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await archiveRoom(room._id, user);

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: TAPi18n.__('Channel_Archived', {
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
