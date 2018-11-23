import { Meteor } from 'meteor/meteor';

Meteor.methods({
	async getReadReceipts({ messageId }) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getReadReceipts' });
		}

		if (!messageId) {
			throw new Meteor.Error('error-invalid-message', 'The required \'messageId\' param is missing.', { method: 'getReadReceipts' });
		}

		return RocketChat.Services.call('messageReadReceipt.getReadReceipts', { uid, messageId });
	},
});
