import { Meteor } from 'meteor/meteor';

import { getMessageForUser } from '../../../../server/lib/messages/getMessageForUser';

function getMessageById(messageId) {
	try {
		return Promise.await(getMessageForUser(messageId, Meteor.userId()));
	} catch (e) {
		throw new Meteor.Error(e.message, 'Invalid message', {
			function: 'actionLinks.getMessage',
		});
	}
}

// Action Links namespace creation.
export const actionLinks = {
	actions: {},
	register(name, funct) {
		actionLinks.actions[name] = funct;
	},
	getMessage(name, messageId) {
		const message = getMessageById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				function: 'actionLinks.getMessage',
			});
		}

		if (!message.actionLinks || !message.actionLinks[name]) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
				function: 'actionLinks.getMessage',
			});
		}

		return message;
	},
};
