import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || isEditedMessage(message)) {
			return message;
		}

		// if the message has not a token, it was sent by the agent, so ignore it
		if (!message.token) {
			return message;
		}

		// check if room is yet awaiting for response
		if (typeof room.t !== 'undefined' && room.t === 'l' && room.waitingResponse) {
			return message;
		}

		await LivechatRooms.setNotResponseByRoomId(room._id);

		return message;
	},
	callbacks.priority.LOW,
	'markRoomNotResponded',
);
