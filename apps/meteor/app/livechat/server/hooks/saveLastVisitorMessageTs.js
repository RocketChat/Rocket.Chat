import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models';

callbacks.add(
	'afterSaveMessage',
	function (message, room) {
		if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
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
