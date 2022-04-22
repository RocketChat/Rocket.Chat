import { IRoom, isOmnichannelRoom, IMessage, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		if (!room.v?.token) {
			return message;
		}
		if ((message as IOmnichannelMessage).token) {
			LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
		}
		return message;
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
