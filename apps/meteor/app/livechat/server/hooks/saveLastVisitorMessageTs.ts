import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!(isOmnichannelRoom(room) && room.v.token)) {
			return message;
		}
		if (message.t) {
			return message;
		}
		if (!message.token) {
			return message;
		}

		await LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
