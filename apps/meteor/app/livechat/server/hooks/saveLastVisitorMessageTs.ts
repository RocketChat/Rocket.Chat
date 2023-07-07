import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { callbackLogger } from '../lib/logger';

callbacks.add(
	'afterSaveMessage',
	async function (message, room) {
		if (!(isOmnichannelRoom(room) && room.v.token)) {
			return message;
		}
		if (message.t) {
			return message;
		}
		if (message.token) {
			await LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
			callbackLogger.debug({
				msg: 'Saved last visitor message timestamp',
				rid: room._id,
				msgId: message._id,
			});
		}
		return message;
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
