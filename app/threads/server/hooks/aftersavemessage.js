import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { settings } from '../../../settings/server';
import { reply } from '../functions';
import { updateUsersSubscriptions } from '../../../lib/server/lib/notifyUsersOnMessage';
import { sendMessageNotifications } from '../../../lib/server/lib/sendNotificationsOnMessage';


// messages in a thread will have normal behavior as sent to the room it belongs;


function notifyUsersOnReply(message, replies, room) {
	// // skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	// if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
	// 	return message;
	// }

	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt) {
		return message;
	}

	updateUsersSubscriptions(message, room, replies);

	// let toAll = false;
	// let toHere = false;
	// const mentionIds = [];
	// const highlightsIds = [];
	// const highlights = Subscriptions.findByRoomAndUsersWithUserHighlights(room._id, replies, { fields: { userHighlights: 1, 'u._id': 1 } }).fetch();

	// if (message.mentions != null) {
	// 	message.mentions.forEach(function(mention) {
	// 		if (!toAll && mention._id === 'all') {
	// 			toAll = true;
	// 		}
	// 		if (!toHere && mention._id === 'here') {
	// 			toHere = true;
	// 		}
	// 		if (mention._id !== message.u._id) {
	// 			mentionIds.push(mention._id);
	// 		}
	// 	});
	// }

	// highlights.forEach(function(subscription) {
	// 	if (messageContainsHighlight(message, subscription.userHighlights)) {
	// 		if (subscription.u._id !== message.u._id) {
	// 			highlightsIds.push(subscription.u._id);
	// 		}
	// 	}
	// });

	// if (room.t === 'd') {
	// 	const unreadCountDM = settings.get('Unread_Count_DM');

	// 	if (unreadCountDM === 'all_messages') {
	// 		Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
	// 	} else if (toAll || toHere) {
	// 		Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, 1);
	// 	} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
	// 		Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, 1);
	// 	}
	// } else {
	// 	const unreadCount = settings.get('Unread_Count');

	// 	if (toAll || toHere) {
	// 		let incUnread = 0;
	// 		if (['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
	// 			incUnread = 1;
	// 		}
	// 		Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);

	// 	} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
	// 		let incUnread = 0;
	// 		if (['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
	// 			incUnread = 1;
	// 		}
	// 		Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, incUnread);
	// 	} else if (unreadCount === 'all_messages') {
	// 		Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
	// 	}
	// }

	return message;
}

const metaData = (message, parentMessage) => {
	reply({ tmid: message.tmid }, message, parentMessage);

	return message;
};

const notification = (message, room, replies) => {

	// will send a notification to everyone who replied/followed the thread except the owner of the message
	sendMessageNotifications(message, room, replies);

	return message;
};

const processThreads = (message, room) => {
	if (!message.tmid) {
		return;
	}

	const parentMessage = Messages.findOne({ _id: message.tmid });
	if (!parentMessage) {
		return;
	}

	const replies = [].concat(parentMessage.replies).filter((userId) => userId !== message.u._id);

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
