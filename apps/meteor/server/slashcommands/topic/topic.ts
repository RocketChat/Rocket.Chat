import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { saveRoomSettings } from '../../../app/channel-settings/server/methods/saveRoomSettings';
import { slashCommands } from '../../../app/utils/server/slashCommand';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';

slashCommands.add({
	command: 'topic',
	callback: async ({ params, message, userId }: SlashCommandCallbackParams<'topic'>): Promise<void> => {
		if (userId && (await hasPermissionAsync(userId, 'edit-room', message.rid))) {
			await saveRoomSettings(userId, message.rid, 'roomTopic', params);
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
