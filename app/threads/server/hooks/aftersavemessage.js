import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings/server';
import { reply } from '../functions';
import { updateUsersSubscriptions } from '../../../lib/server/lib/notifyUsersOnMessage';
import { sendMessageNotifications } from '../../../lib/server/lib/sendNotificationsOnMessage';

function notifyUsersOnReply(message, replies, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	updateUsersSubscriptions(message, room, replies);

	return message;
}

const metaData = (message, parentMessage) => {
	reply({ tmid: message.tmid }, message, parentMessage);

	return message;
};

const notification = (message, room, replies) => {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	// will send a notification to everyone who replied/followed the thread except the owner of the message
	sendMessageNotifications(message, room, replies);

	return message;
};

const processThreads = (message, room) => {
	if (!message.tmid) {
		return;
	}

	const parentMessage = Messages.findOneById(message.tmid);
	if (!parentMessage) {
		return;
	}

	const replies = [
		parentMessage.u._id,
		...parentMessage.replies || [],
	].filter((userId) => userId !== message.u._id);

	notifyUsersOnReply(message, replies, room);
	metaData(message, parentMessage);
	notification(message, room, replies);
};

Meteor.startup(function() {
	settings.get('Threads_enabled', function(key, value) {
		if (!value) {
			callbacks.remove('afterSaveMessage', 'threads-after-save-message');
			return;
		}
		callbacks.add('afterSaveMessage', processThreads, callbacks.priority.LOW, 'threads-after-save-message');
	});
});
