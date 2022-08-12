import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { canDeleteMessage } from '../lib/utils/canDeleteMessage';

Meteor.methods({
	deleteMessage(msg) {
		if (!Meteor.userId()) {
			return false;
		}

		// We're now only passed in the `_id` property to lower the amount of data sent to the server
		const message = ChatMessage.findOne({ _id: msg._id });

		if (
			!canDeleteMessage({
				rid: message.rid,
				ts: message.ts,
				uid: message.u._id,
			})
		) {
			return false;
		}

		ChatMessage.remove({
			'_id': message._id,
			'u._id': Meteor.userId(),
		});
	},
});
