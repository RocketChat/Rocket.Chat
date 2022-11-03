import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { actionLinks } from './lib/actionLinks';
// Action Links Handler. This method will be called off the client.

Meteor.methods({
	actionLinkHandler(name, messageId) {
		check(messageId, String);
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'actionLinkHandler' });
		}

		const message = actionLinks.getMessage(name, messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'actionLinkHandler' });
		}

		// NOTE: based on types (and how FE uses it) this should be the way of doing it
		const actionLink = message.actionLinks?.find((action) => action.method_id === name);

		if (!actionLink) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', { method: 'actionLinkHandler' });
		}

		actionLinks.actions[actionLink.method_id](message, actionLink.params);
	},
});
