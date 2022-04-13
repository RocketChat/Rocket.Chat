import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { LivechatRooms } from '../../../../../app/models/server';

const handleAfterSaveMessage = (message, { _id: rid }) => {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return message;
	}

	// Need to read the room every time, the room object is not updated
	const room = LivechatRooms.findOneById(rid, { t: 1, v: 1, onHold: 1 });
	if (!room) {
		return message;
	}

	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}

	// if a visitor sends a message in room which is On Hold
	if (message.token && room.onHold) {
		Meteor.call('livechat:resumeOnHold', rid, { clientAction: false });
	}

	return message;
};

callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-resume-on-hold');
