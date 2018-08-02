import { Meteor } from 'meteor/meteor';

import { ReadReceipt } from '../../lib/ReadReceipt';

Meteor.methods({
	getReadReceipts({ messageId }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getReadReceipts' });
		}

		if (!messageId) {
			throw new Meteor.Error('error-invalid-message', 'The required \'messageId\' param is missing.', { method: 'getReadReceipts' });
		}

		const message = RocketChat.models.Messages.findOneById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'getReadReceipts' });
		}

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getReadReceipts' });
		}

		return ReadReceipt.getReceipts(message);
	}
});
