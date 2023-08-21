import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
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

		// skips this callback if the message is a system message
		if (message.t) {
			return message;
		}

		// if the message has a token, it was sent by the visitor, so ignore it
		if (message.token) {
			return message;
		}

		// check if room is yet awaiting for response from visitor
		if (!room.waitingResponse) {
			// case where agent sends second message or any subsequent message in a room before visitor responds to the first message
			// in this case, we just need to update the lastMessageTs of the responseBy object
			if (room.responseBy) {
				await LivechatRooms.setAgentLastMessageTs(room._id);
			}
			return message;
		}

		// This is the first message from agent after visitor had last responded
		const responseBy: IOmnichannelRoom['responseBy'] = room.responseBy || {
			_id: message.u._id,
			username: message.u.username,
			firstResponseTs: new Date(message.ts),
			lastMessageTs: new Date(message.ts),
		};

		// this unsets waitingResponse and sets responseBy object
		await LivechatRooms.setResponseByRoomId(room._id, responseBy);

		return message;
	},
	callbacks.priority.HIGH,
	'markRoomResponded',
);
