import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';

slashCommands.add({
	command: 'topic',
	callback: async (_command: 'topic', params, item): Promise<void> => {
		const uid = Meteor.userId();
		if (uid && (await hasPermissionAsync(uid, 'edit-room', item.rid))) {
			await Meteor.callAsync('saveRoomSettings', item.rid, 'roomTopic', params);
		}
	},
	options: {
		description: 'Slash_Topic_Description',
		params: 'Slash_Topic_Params',
		permission: 'edit-room',
	},
});
