import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import s from 'underscore.string';
import { Tracker } from 'meteor/tracker';
import { PersistentMinimongo2 } from 'meteor/frozeman:persistent-minimongo2';

import { CachedChatSubscription } from './CachedChatSubscription';
import { ChatSubscription } from './ChatSubscription';
import { getConfig } from '../../../ui-utils/client/config';
import { renderMessageBody } from '../../../ui-utils/client/lib/renderMessageBody';
import { promises } from '../../../promises/client';

export const ChatMessage = new Mongo.Collection(null);

ChatMessage.setReactions = function(messageId, reactions) {
	return this.update({ _id: messageId }, { $set: { reactions } });
};

ChatMessage.unsetReactions = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { reactions: 1 } });
};

new PersistentMinimongo2(ChatMessage, 'Message');

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
			let ts;
			const { rid, ls } = subscription;
			const lastMessage = ChatMessage.findOne(
				{ rid, _hidden: { $ne: true } },
				{ sort: { ts: 1 } }
			);
			if (lastMessage) {
				({ ts } = lastMessage);
			} else {
				ts = undefined;
			}
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
