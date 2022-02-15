import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms } from '../../../models/server/index';
import { IRoom, isOmnichannelRoom } from '../../../../definition/IRoom';
import { IMessage } from '../../../../definition/IMessage';

callbacks.add(
	'afterSaveMessage',
	function (message: IMessage, room: IRoom): IMessage {
		// do nothing if room is not omnichannel room
		if (!isOmnichannelRoom(room)) {
			return message;
		}

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
