import { Meteor } from 'meteor/meteor';
import { IMessage } from '@rocket.chat/core-typings';

import { handleError } from '../../../../client/lib/utils/handleError';

// Action Links namespace creation.
export const actionLinks = {
	actions: new Map<string, Function>(),
	register(name: string, fn: Function): void {
		actionLinks.actions.set(name, fn);
	},
	// getMessage(name, messageId) {
	// 	const userId = Meteor.userId();
	// 	if (!userId) {
	// 		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
	// 			function: 'actionLinks.getMessage',
	// 		});
	// 	}

	// 	const message = Messages.findOne({ _id: messageId });
	// 	if (!message) {
	// 		throw new Meteor.Error('error-invalid-message', 'Invalid message', {
	// 			function: 'actionLinks.getMessage',
	// 		});
	// 	}

	// 	const subscription = Subscriptions.findOne({
	// 		'rid': message.rid,
	// 		'u._id': userId,
	// 	});
	// 	if (!subscription) {
	// 		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
	// 			function: 'actionLinks.getMessage',
	// 		});
	// 	}

	// 	if (!message.actionLinks || !message.actionLinks[name]) {
	// 		throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
	// 			function: 'actionLinks.getMessage',
	// 		});
	// 	}

	// 	return message;
	// },
	run(method: string, message: IMessage, instance?: Blaze.TemplateInstance | Function): void {
		const actionLink = message.actionLinks && message.actionLinks.find((action) => action.method_id === method);

		if (!actionLink) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link');
		}

		if (!actionLinks.actions.has(actionLink.method_id)) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link');
		}

		const fn = actionLinks.actions.get(actionLink.method_id);

		let ranClient = false;

		if (fn) {
			// run just on client side
			fn(message, actionLink.params, instance);

			ranClient = true;
		}

		// and run on server side
		Meteor.call('actionLinkHandler', name, message._id, (err: Error) => {
			if (err && !ranClient) {
				handleError(err);
			}
		});
	},
};
