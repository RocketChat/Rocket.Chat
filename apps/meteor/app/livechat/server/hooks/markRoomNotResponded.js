import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		// skips this callback if the message was edited
		if (!message || message.editedAt) {
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

		LivechatRooms.setNotResponseByRoomId(room._id);

		return message;
	},
	callbacks.priority.LOW,
	'markRoomNotResponded',
);
