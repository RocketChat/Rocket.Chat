import { Meteor } from 'meteor/meteor';

import { ReadReceipt } from '../../lib/ReadReceipt';

Meteor.methods({
	getReadReceipts({ messageId }) {
		const message = RocketChat.models.Messages.findOneById(messageId);

		return ReadReceipt.getReceipts(message);
	}
});
