import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { ChatRoom } from '../../models/client/models/ChatRoom';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization/client';
import { dispatchToastMessage } from '../../../client/lib/toast';

slashCommands.add({
	command: 'topic',
	callback: async function Topic(_command: 'topic', params, item): Promise<void> {
		if (hasPermission('edit-room', item.rid)) {
			try {
				await Meteor.callAsync('saveRoomSettings', item.rid, 'roomTopic', params);
				callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
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
