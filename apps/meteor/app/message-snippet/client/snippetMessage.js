import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { ChatMessage, Subscriptions } from '../../models';

Meteor.methods({
	snippetMessage(message) {
		if (typeof Meteor.userId() === 'undefined' || Meteor.userId() === null) {
			return false;
		}
		if (
			typeof settings.get('Message_AllowSnippeting') === 'undefined' ||
			settings.get('Message_AllowSnippeting') === null ||
			settings.get('Message_AllowSnippeting') === false
		) {
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
