import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';

const handleAfterSaveMessage = async (message: any = {}, room: any = {}): Promise<any> => {
	const { _id: rid, onHold } = room;
	if (!rid) {
		return message;
	}

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}
	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}
	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return message;
	}

	// if a visitor sends a message in room which is On Hold
	if (message.token && onHold) {
		await AutoCloseOnHoldScheduler.unscheduleRoom(rid);
		await Meteor.call('livechat:resumeOnHold', room._id, { clientAction: false });
	}

	return message;
};

callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-resume-on-hold');
