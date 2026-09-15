import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { clientCallbacks } from '@rocket.chat/ui-client';

import { sdk } from '../../lib/SDKClient';
import { hasPermission } from '../../lib/authorization';
import { slashCommands } from '../../lib/slashCommand';
import { dispatchToastMessage } from '../../lib/toast';
import { Rooms } from '../../stores';

slashCommands.add({
	command: 'topic',
	callback: async function Topic({ params, message }: SlashCommandCallbackParams<'topic'>): Promise<void> {
		if (hasPermission('edit-room', message.rid)) {
			try {
				await sdk.rest.post('/v1/rooms.saveRoomSettings', { rid: message.rid, roomTopic: params });
				await clientCallbacks.run('roomTopicChanged', Rooms.state.get(message.rid));
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
				throw error;
			}
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
