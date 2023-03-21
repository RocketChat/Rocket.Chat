import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';

slashCommands.add({
	command: 'topic',
	callback: async function Topic(_command: 'topic', params, item): void {
		if (await hasPermissionAsync(Meteor.userId() as string, 'edit-room', item.rid)) {
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
