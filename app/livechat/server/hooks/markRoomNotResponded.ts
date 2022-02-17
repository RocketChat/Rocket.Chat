import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';
import { IMessage } from '../../../../definition/IMessage';
import { IRoom, isOmnichannelRoom } from '../../../../definition/IRoom';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom | undefined): IMessage {
		if (!room || !isOmnichannelRoom(room)) {
			return message;
		}

		// skips this callback if the message was edited
		if (!message || message.editedAt) {
			return message;
		}

		// if the message has not a token, it was sent by the agent, so ignore it
		if (!message.token) {
			return message;
		}

		// check if room is yet awaiting for response
		if (room.t === 'l' && room.isWaitingResponse) {
			return message;
		}

		LivechatRooms.setNotResponseByRoomId(room._id);

		return message;
	},
	callbacks.priority.LOW,
	'markRoomNotResponded',
);
