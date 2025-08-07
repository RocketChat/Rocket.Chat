import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { dispatchToastMessage } from '../../../client/lib/toast';
import { Rooms } from '../../../client/stores';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization/client';
import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/client/slashCommand';

slashCommands.add({
	command: 'topic',
	callback: async function Topic({ params, message }: SlashCommandCallbackParams<'topic'>): Promise<void> {
		if (hasPermission('edit-room', message.rid)) {
			try {
				await sdk.call('saveRoomSettings', message.rid, 'roomTopic', params);
				await callbacks.run('roomTopicChanged', Rooms.state.get(message.rid));
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
