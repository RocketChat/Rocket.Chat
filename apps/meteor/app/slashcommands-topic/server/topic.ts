import { Meteor } from 'meteor/meteor';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';

slashCommands.add({
	command: 'topic',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'topic'>): Promise<void> => {
		if (userId && (await hasPermissionAsync(userId, 'edit-room', message.rid))) {
			await Meteor.callAsync('saveRoomSettings', message.rid, 'roomTopic', params);
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
