import { Meteor } from 'meteor/meteor';

import { ReadReceipt } from '../../lib/ReadReceipt';

Meteor.methods({
	getReadReceipts({ messageId }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getReadReceipts' });
		}

		const message = RocketChat.models.Messages.findOneById(messageId);

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getReadReceipts' });
		}

		return ReadReceipt.getReceipts(message);
	}
});
