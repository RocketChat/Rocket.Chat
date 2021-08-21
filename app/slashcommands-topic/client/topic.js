import { Meteor } from 'meteor/meteor';

import { handleError, slashCommands } from '../../utils/client';
import { ChatRoom } from '../../models/client';
import { callbacks } from '../../callbacks/client';
import { hasPermission } from '../../authorization/client';

function Topic(command, params, item) {
	if (command === 'topic') {
		if (hasPermission('edit-room', item.rid)) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					return handleError(err);
				}
				callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
			});
		}
	}
}

slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
	permission: 'edit-room',
});
