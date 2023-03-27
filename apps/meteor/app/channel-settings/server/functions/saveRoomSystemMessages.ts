import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '@rocket.chat/models';

import { MessageTypesValues } from '../../../lib/lib/MessageTypes';

export const saveRoomSystemMessages = async function (rid: string, systemMessages: string[]) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	if (
		systemMessages &&
		(!Match.test(systemMessages, [String]) || systemMessages.some((value) => !MessageTypesValues.map(({ key }) => key).includes(value)))
	) {
		throw new Meteor.Error('invalid-room', 'Invalid option', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	return Rooms.setSystemMessagesById(rid, systemMessages);
};
