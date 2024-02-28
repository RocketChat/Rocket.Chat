import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { MessageTypesValues as messageTypesValues } from '../../../lib/lib/MessageTypes';

export const saveRoomSystemMessages = async function (rid: string, systemMessages: MessageTypesValues[]) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	if (
		systemMessages &&
		(!Match.test(systemMessages, [String]) || systemMessages.some((value) => !messageTypesValues.map(({ key }) => key).includes(value)))
	) {
		throw new Meteor.Error('invalid-room', 'Invalid option', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	return Rooms.setSystemMessagesById(rid, systemMessages);
};
