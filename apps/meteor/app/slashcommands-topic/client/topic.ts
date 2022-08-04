import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { ChatRoom } from '../../models/client/models/ChatRoom';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization/client';
import { handleError } from '../../../client/lib/utils/handleError';

slashCommands.add({
	command: 'topic',
	callback: function Topic(_command: 'topic', params, item): void {
		if (hasPermission('edit-room', item.rid)) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err: Meteor.Error) => {
				if (err) {
					handleError(err);
					throw err;
				}

				callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
			});
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
