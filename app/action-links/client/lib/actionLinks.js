import { Meteor } from 'meteor/meteor';

import { handleError } from '../../../../client/lib/utils/handleError';
import { Messages } from '../../../models/client';

// Action Links namespace creation.
export const actionLinks = {
	actions: {},
	register(name, funct) {
		actionLinks.actions[name] = funct;
	},
	getMessage(name, messageId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				function: 'actionLinks.getMessage',
			});
		}

		const message = Messages.findOne({ _id: messageId });
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
	run(name, messageId, instance) {
		const message = actionLinks.getMessage(name, messageId);

		const actionLink = message.actionLinks[name];

		let ranClient = false;

		if (actionLinks && actionLinks.actions && actionLinks.actions[actionLink.method_id]) {
			// run just on client side
			actionLinks.actions[actionLink.method_id](message, actionLink.params, instance);

			ranClient = true;
		}

		// and run on server side
		Meteor.call('actionLinkHandler', name, messageId, (err) => {
			if (err && !ranClient) {
				handleError(err);
			}
		});
	},
};
