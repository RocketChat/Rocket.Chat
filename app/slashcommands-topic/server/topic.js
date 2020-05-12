import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/server';
import { hasPermission } from '../../authorization/server';

function Topic(command, params, item) {
	if (command === 'topic') {
		if (hasPermission(Meteor.userId(), 'edit-room', item.rid)) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					throw err;
				}
			});
		}
	}
}

slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
	permission: 'edit-room',
});
