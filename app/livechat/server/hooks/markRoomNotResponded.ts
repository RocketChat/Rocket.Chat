import { IRoom } from '../../../../definition/IRoom';
import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';

type MessageData = {
	editedAt: Date;
	token: string;
	t: string;
	msg: string;
	u: {
		_id: string;
		username: string;
	};
};

type RoomData = {
	_id: string;
	t: string;
	isWaitingResponse: boolean;
};

callbacks.add(
	'afterSaveMessage',
	function (message: MessageData, room: RoomData | undefined): MessageData {
		// skips this callback if the message was edited
		if (!message || message.editedAt) {
			return message;
		}

		// if the message has not a token, it was sent by the agent, so ignore it
		if (!message.token) {
			return message;
		}

		// check if room is yet awaiting for response
		if (typeof room?.t !== 'undefined' && room.t === 'l' && room.isWaitingResponse) {
			return message;
		}

		LivechatRooms.setNotResponseByRoomId(room?._id);

		return message;
	},
	callbacks.priority.LOW,
	'markRoomNotResponded',
);
