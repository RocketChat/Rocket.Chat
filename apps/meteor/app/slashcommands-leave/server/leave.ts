import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { leaveRoomMethod } from '../../lib/server/methods/leaveRoom';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

/*
 * Leave is a named function that will replace /leave commands
 * @param {Object} message - The message object
 */
const Leave = async function Leave({ message, userId }: SlashCommandCallbackParams<'leave'>): Promise<void> {
	try {
		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}
		await leaveRoomMethod(user, message.rid);
	} catch ({ error }: any) {
		if (typeof error !== 'string') {
			return;
		}
		const user = await Users.findOneById(userId);
		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: i18n.t(error, { lng: user?.language || settings.get('Language') || 'en' }),
		});
	}
};

slashCommands.add({
	command: 'leave',
	callback: Leave,
	options: {
		description: 'Leave_the_current_channel',
		permission: ['leave-c', 'leave-p'],
	},
});
slashCommands.add({
	command: 'part',
	callback: Leave,
	options: {
		description: 'Leave_the_current_channel',
		permission: ['leave-c', 'leave-p'],
	},
});
