import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { ChatRoom } from '../../models/client/models/ChatRoom';
import { callbacks } from '../../../lib/callbacks';
import { hasPermission } from '../../authorization/client';
import { handleError } from '../../../client/lib/utils/handleError';

function Topic(_command: 'topic', params: string, item: IMessage): void {
	if (Meteor.isClient && hasPermission('edit-room', item.rid)) {
		Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err: Meteor.Error) => {
			if (err) {
				if (Meteor.isClient) {
					handleError(err);
				}
				throw err;
			}

			if (Meteor.isClient) {
				callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
			}
		});
	}
}

slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
	permission: 'edit-room',
});
