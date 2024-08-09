import { api, Room } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

slashCommands.add({
	command: 'join',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'join'>): Promise<void> => {
		let channel = params.trim();
		if (channel === '') {
			return;
		}

		if (!userId) {
			return;
		}

		channel = channel.replace('#', '');

		const room = await Rooms.findOneByNameAndType(channel, 'c');
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

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, userId, {
			projection: { _id: 1 },
		});

		if (subscription) {
			throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
				method: 'slashCommands',
			});
		}

		await Room.join({ room, user: { _id: userId } });
	},
	options: {
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
});
