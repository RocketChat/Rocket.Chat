import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatMessage, CachedChatMessage } from '../../app/models/client';
import { canDeleteMessage, SWCache } from '../../app/utils/client';

Meteor.methods({
	deleteMessage(msg) {
		if (!Meteor.userId()) {
			return false;
		}

		// We're now only passed in the `_id` property to lower the amount of data sent to the server
		const message = ChatMessage.findOne({ _id: msg._id });

		if (!message || !canDeleteMessage({
			rid: message.rid,
			ts: message.ts,
			uid: message.u._id,
		})) {
			return false;
		}

		if (message.temp && message.tempActions.send) {
			ChatMessage.remove({
				_id: message._id,
				'u._id': Meteor.userId(),
			});
			CachedChatMessage.save();
			if (message.file) {
				SWCache.removeFromCache(message.file);
				Session.set(`uploading-cancel-${ message.file._id }`, true);
			}
		} else {
			const messageObject = { temp: true, msg: 'Message deleted', tempActions: { delete: true } };

			ChatMessage.update({
				_id: message._id,
				'u._id': Meteor.userId(),
			}, { $set: messageObject, $unset: { reactions: 1, file: 1, attachments: 1 } });
			CachedChatMessage.save();
		}
	},
});
