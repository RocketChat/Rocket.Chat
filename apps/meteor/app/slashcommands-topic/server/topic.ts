import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermission } from '../../authorization/server/functions/hasPermission';

slashCommands.add({
	command: 'topic',
	callback: function Topic(_command: 'topic', params, item): void {
		if (Meteor.isServer && hasPermission(Meteor.userId() as string, 'edit-room', item.rid)) {
			Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, (err: Meteor.Error) => {
				if (err) {
					throw err;
				}
			});
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
