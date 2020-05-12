import { Meteor } from 'meteor/meteor';

import { actionLinks } from '../both/lib/actionLinks';
// Action Links Handler. This method will be called off the client.

Meteor.methods({
	actionLinkHandler(name, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'actionLinkHandler' });
		}

		const message = actionLinks.getMessage(name, messageId);

		const actionLink = message.actionLinks[name];

		actionLinks.actions[actionLink.method_id](message, actionLink.params);
	},
});
