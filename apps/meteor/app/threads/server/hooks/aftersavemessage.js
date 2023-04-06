import { Meteor } from 'meteor/meteor';
import { Messages } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { reply } from '../functions';
import { updateThreadUsersSubscriptions, getMentions } from '../../../lib/server/lib/notifyUsersOnMessage';
import { sendMessageNotifications } from '../../../lib/server/lib/sendNotificationsOnMessage';

async function notifyUsersOnReply(message, replies, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	await updateThreadUsersSubscriptions(message, room, replies);

	return message;
}

async function metaData(message, parentMessage, followers) {
	await reply({ tmid: message.tmid }, message, parentMessage, followers);

	return message;
}

const notification = (message, room, replies) => {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	// will send a notification to everyone who replied/followed the thread except the owner of the message
	sendMessageNotifications(message, room, replies);

	return message;
};

export async function processThreads(message, room) {
	if (!message.tmid) {
		return message;
	}

	const parentMessage = await Messages.findOneById(message.tmid);
	if (!parentMessage) {
		return message;
	}

	const { mentionIds } = getMentions(message);

	const replies = [
		...new Set([
			...((!parentMessage.tcount ? [parentMessage.u._id] : parentMessage.replies) || []),
			...(!parentMessage.tcount && room.t === 'd' ? room.uids : []),
			...mentionIds,
		]),
	].filter((userId) => userId !== message.u._id);

	await notifyUsersOnReply(message, replies, room);
	await metaData(message, parentMessage, replies);
	notification(message, room, replies);

	return message;
}

Meteor.startup(function () {
	settings.watch('Threads_enabled', function (value) {
		if (!value) {
			callbacks.remove('afterSaveMessage', 'threads-after-save-message');
			return;
		}
		callbacks.add(
			'afterSaveMessage',
			async function (message, room) {
				return processThreads(message, room);
			},
			callbacks.priority.LOW,
			'threads-after-save-message',
		);
	});
});
