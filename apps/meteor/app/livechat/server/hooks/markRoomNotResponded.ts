import { IRoom, isOmnichannelRoom, IMessage, isEditedMessage, IOmnichannelMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom | undefined): IMessage {
		if (!room || !isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isEditedMessage(message)) {
			return message;
		}

		// if the message has not a token, it was sent by the agent, so ignore it
		if (!(message as IOmnichannelMessage).token) {
			return message;
		}

		// check if room is yet awaiting for response
		if (room.waitingResponse) {
			return message;
		}

		LivechatRooms.setNotResponseByRoomId(room._id);

		return message;
	},
	callbacks.priority.LOW,
	'markRoomNotResponded',
);
