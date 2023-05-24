import { Meteor } from 'meteor/meteor';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { ChatRoom } from '../../models/client/models/ChatRoom';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization/client';
import { dispatchToastMessage } from '../../../client/lib/toast';

slashCommands.add({
	command: 'topic',
	callback: async function Topic({ params, message }: SlashCommandCallbackParams<'topic'>): Promise<void> {
		if (hasPermission('edit-room', message.rid)) {
			try {
				await Meteor.callAsync('saveRoomSettings', message.rid, 'roomTopic', params);
				await callbacks.run('roomTopicChanged', ChatRoom.findOne(message.rid));
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
