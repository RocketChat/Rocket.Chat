import { isMessageFromVisitor } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterOmnichannelSaveMessage',
	async (message, { room }) => {
		if (message.t) {
			return message;
		}
		if (!isMessageFromVisitor(message)) {
			return message;
		}

		await LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
