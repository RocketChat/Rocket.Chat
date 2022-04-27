import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils';
import { ChatRoom } from '../../models';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization';

function Topic(command, params, item) {
	if (command === 'topic') {
		if (
			(Meteor.isClient && hasPermission('edit-room', item.rid)) ||
			(Meteor.isServer && hasPermission(Meteor.userId(), 'edit-room', item.rid))
		) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err) => {
				if (err) {
					if (Meteor.isClient) {
						const { handleError } = require('../../../client/lib/utils/handleError');
						return handleError(err);
					}
					throw err;
				}

				if (Meteor.isClient) {
					callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
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
