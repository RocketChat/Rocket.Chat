import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages, Reports } from '../../app/models';

Meteor.methods({
	removeLinkPreview(messageId) {
		check(messageId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'reportMessage',
			});
		}

		const message = Messages.findOneById(messageId);
		if (!message) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}
		
		Messages.removeLinkPreview(message._id);

		return true;
	},
});
