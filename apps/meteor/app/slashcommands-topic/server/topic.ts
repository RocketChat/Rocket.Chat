import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../channel-settings/server/methods/saveRoomSettings';

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
