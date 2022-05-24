import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermission } from '../../authorization/server/functions/hasPermission';

function Topic(_command: 'topic', params: string, item: IMessage): void {
	if (Meteor.isServer && hasPermission(Meteor.userId() as string, 'edit-room', item.rid)) {
		Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err: Meteor.Error) => {
			if (err) {
				throw err;
			}
		});
	}
}

slashCommands.add('topic', Topic, {
	description: 'Slash_Topic_Description',
	params: 'Slash_Topic_Params',
	permission: 'edit-room',
});
