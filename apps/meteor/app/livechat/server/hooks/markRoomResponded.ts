import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors } from '@rocket.chat/models';
import moment from 'moment';

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

		// if the message has a token, it was sent by the visitor, so ignore it
		if (message.token) {
			return message;
		}

		// Return YYYY-MM from moment
		const monthYear = moment().format('YYYY-MM');
		if (!(await LivechatVisitors.isVisitorActiveOnPeriod(room.v._id, monthYear))) {
			await Promise.all([
				LivechatVisitors.markVisitorActiveForPeriod(room.v._id, monthYear),
				LivechatRooms.markVisitorActiveForPeriod(room._id, monthYear),
			]);
		}

		if (room.responseBy) {
			await LivechatRooms.setAgentLastMessageTs(room._id);
		}

		// check if room is yet awaiting for response
		if (!room.waitingResponse) {
			return message;
		}

		await LivechatRooms.setResponseByRoomId(room._id, {
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
