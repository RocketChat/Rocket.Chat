import { Meteor } from 'meteor/meteor';

import { ChatMessage, Subscriptions } from '../../models/client';

Meteor.methods({
	snippetMessage(message) {
		if (typeof Meteor.userId() === 'undefined' || Meteor.userId() === null) {
			return false;
		}

		const subscription = Subscriptions.findOne({ 'rid': message.rid, 'u._id': Meteor.userId() });

		if (subscription === undefined) {
			return false;
		}
		ChatMessage.update(
			{
				_id: message._id,
			},
			{
				$set: {
					snippeted: true,
				},
			},
		);
	},
});
