import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';

type MessageData = { token: string; ts: string };
type RoomData = {
	_id: string;
	t: string;
	v: { token: string };
};

callbacks.add(
	'afterSaveMessage',
	function (message: MessageData, room: RoomData | undefined): MessageData {
		if (!(typeof room?.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
			return message;
		}
		if (message.token) {
			LivechatRooms.setVisitorLastMessageTimestampByRoomId(room._id, message.ts);
		}
		return message;
	},
	callbacks.priority.HIGH,
	'save-last-visitor-message-timestamp',
);
