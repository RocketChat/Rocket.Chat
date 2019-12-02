import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Tracker } from 'meteor/tracker';

import { CachedCollection } from '../../../ui-cached-collection';
import { CachedChatSubscription } from './CachedChatSubscription';
import { ChatSubscription } from './ChatSubscription';
import { getConfig } from '../../../ui-utils/client/config';
import { renderMessageBody } from '../../../ui-utils/client/lib/renderMessageBody';
import { promises } from '../../../promises/client';

export const CachedChatMessage = new CachedCollection({ name: 'chatMessage' });

export const ChatMessage = CachedChatMessage.collection;

ChatMessage.setReactions = function(messageId, reactions, tempActions) {
	const messageObject = { temp: true, tempActions, reactions };
	return this.update({ _id: messageId }, { $set: messageObject });
};

ChatMessage.unsetReactions = function(messageId, tempActions) {
	const messageObject = { temp: true, tempActions };
	return this.update({ _id: messageId }, { $unset: { reactions: 1 }, $set: messageObject });
};

ChatMessage.setProgress = function(messageId, upload) {
	return this.update({ _id: messageId }, { $set: { uploads: upload } });
};

const normalizeThreadMessage = (message) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
	}
};

const upsertMessage = async ({ msg, subscription, uid = Tracker.nonreactive(() => Meteor.userId()) }, collection = ChatMessage) => {
	const userId = msg.u && msg.u._id;

	if (subscription && subscription.ignored && subscription.ignored.indexOf(userId) > -1) {
		msg.ignored = true;
	}

	if (msg.t === 'e2e' && !msg.file) {
		msg.e2e = 'pending';
	}
	msg = await promises.run('onClientMessageReceived', msg) || msg;

	const { _id, ...messageToUpsert } = msg;

	if (msg.tcount) {
		collection.direct.update({ tmid: _id }, {
			$set: {
				following: msg.replies && msg.replies.indexOf(uid) > -1,
				threadMsg: normalizeThreadMessage(messageToUpsert),
				repliesCount: msg.tcount,
			},
		}, { multi: true });
	}

	return collection.direct.upsert({ _id }, messageToUpsert);
};

function upsertMessageBulk({ msgs, subscription }, collection = ChatMessage) {
	const uid = Tracker.nonreactive(() => Meteor.userId());
	const { queries } = ChatMessage;
	collection.queries = [];
	msgs.forEach((msg, index) => {
		if (index === msgs.length - 1) {
			ChatMessage.queries = queries;
		}
		upsertMessage({ msg, subscription, uid }, collection);
	});
}

let messagesFetched = false;
Tracker.autorun(() => {
	if (!messagesFetched && CachedChatSubscription.ready.get()) {
		const status = Meteor.status();
		if (status.status !== 'connected') {
			return;
		}
		messagesFetched = true;
		const subscriptions = ChatSubscription.find(
			{
				open: true,
			},
			{
				fields: {
					rid: 1,
					ls: 1,
				},
			}
		);
		const limit = parseInt(getConfig('roomListLimit')) || 50;
		subscriptions.forEach((subscription) => {
			const ts = undefined;
			const { rid, ls } = subscription;
			Meteor.call('loadHistory', rid, ts, limit, ls, (err, result) => {
				if (err) {
					return;
				}
				const { messages = [] } = result;
				upsertMessageBulk({
					msgs: messages.filter((msg) => msg.t !== 'command'),
					subscription,
				});
			});
		});
	}
});
