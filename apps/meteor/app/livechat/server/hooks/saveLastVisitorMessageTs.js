import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		if (!(isOmnichannelRoom(room) && room.v.token)) {
			return message;
		}
		if (message.token) {
			LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
		}
		return message;
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
