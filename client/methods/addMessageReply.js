import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

Meteor.methods({
	addMessageReply(message) {
		if (!Meteor.userId()) {
			return false;
		}

		Tracker.nonreactive(function() {
			message = RocketChat.callbacks.run('beforeSaveMessage', message);
			const messageObject = { customFields: { replyIds: message.customFields.replyIds} };
			ChatMessage.update({
				_id: message._id,
				'u._id': Meteor.userId(),
			}, { $set : messageObject });
		});
	},
});
