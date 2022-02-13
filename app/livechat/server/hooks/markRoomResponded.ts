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
type RoomData = { responseBy: string; t: string; _id: string; isWaitingResponse: boolean };

callbacks.add(
	'afterSaveMessage',
	function (message: MessageData, room: RoomData): MessageData {
		// skips this callback if the message was edited
		if (!message || message.editedAt) {
			return message;
		}

		// if the message has a token, it was sent by the visitor, so ignore it
		if (message.token) {
			return message;
		}
		if (room.responseBy) {
			LivechatRooms.setAgentLastMessageTs(room._id);
		}

		// check if room is yet awaiting for response
		if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.isWaitingResponse)) {
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
