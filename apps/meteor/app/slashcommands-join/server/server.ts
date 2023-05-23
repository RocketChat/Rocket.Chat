import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { i18n } from '../../../server/lib/i18n';
import { joinRoomMethod } from '../../lib/server/methods/joinRoom';

slashCommands.add({
	command: 'join',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'join'>): Promise<void> => {
		let channel = params.trim();
		if (channel === '') {
			return;
		}

		channel = channel.replace('#', '');
		const room = await Rooms.findOneByNameAndType(channel, 'c');

		if (!userId) {
			return;
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

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, userId, {
			projection: { _id: 1 },
		});

		if (subscription) {
			throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
				method: 'slashCommands',
			});
		}

		await joinRoomMethod(userId, room._id);
	},
	options: {
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
});
