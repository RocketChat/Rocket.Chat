import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils';
import { StreamService } from '../../../server/sdk';

/*
* Leave is a named function that will replace /leave commands
* @param {Object} message - The message object
*/
function Leave(command, params, item) {
	if (command !== 'leave' && command !== 'part') {
		return;
	}

	try {
		Meteor.call('leaveRoom', item.rid);
	} catch ({ error }) {
		StreamService.sendEphemeralMessage(Meteor.userId(), item.rid, {
			msg: TAPi18n.__(error, null, Meteor.user().language),
		});
	}
}

slashCommands.add('leave', Leave, {
	description: 'Leave_the_current_channel',
	permission: ['leave-c', 'leave-p'],
});
slashCommands.add('part', Leave, {
	description: 'Leave_the_current_channel',
	permission: ['leave-c', 'leave-p'],
});
