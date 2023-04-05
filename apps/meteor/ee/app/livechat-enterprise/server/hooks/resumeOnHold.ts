import { Meteor } from 'meteor/meteor';
import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'afterSaveMessage',
	async (message, roomParams) => {
		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		// if the message has a type means it is a special message (like the closing comment), so skips
		if (message.t) {
			return message;
		}

		if (!isOmnichannelRoom(roomParams)) {
			return message;
		}

		const { _id: rid, t: roomType, v: roomVisitor } = roomParams;

		// message valid only if it is a livechat room
		if (!(typeof roomType !== 'undefined' && roomType === 'l' && roomVisitor && roomVisitor.token)) {
			return message;
		}

		// Need to read the room every time, the room object is not updated
		const room = await LivechatRooms.findOneById(rid, { projection: { t: 1, v: 1, onHold: 1 } });
		if (!room) {
			return message;
		}

		// if a visitor sends a message in room which is On Hold
		if (message.token && room.onHold) {
			await Meteor.callAsync('livechat:resumeOnHold', rid, { clientAction: false });
		}

		return message;
	},
	callbacks.priority.HIGH,
	'livechat-resume-on-hold',
);
