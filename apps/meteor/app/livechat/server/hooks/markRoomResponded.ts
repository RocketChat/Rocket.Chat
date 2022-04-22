import { IRoom, isOmnichannelRoom, IMessage, isMessageEdited, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isMessageEdited(message)) {
			return message;
		}

		// if the message has a token, it was sent by the visitor, so ignore it
		if ((message as IOmnichannelMessage).token) {
			return message;
		}
		if (room?.responseBy) {
			LivechatRooms.setAgentLastMessageTs(room._id);
		}

		// check if room is yet awaiting for response
		if (!room.waitingResponse) {
			return message;
		}

		LivechatRooms.setResponseByRoomId(room._id, {
			user: {
				_id: message.u._id,
				username: message.u.username,
			},
		});

		return message;
	},
	callbacks.priority.LOW,
	'markRoomResponded',
);
