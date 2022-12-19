import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

import { dispatchToastMessage } from '../../../../client/lib/toast';

// Action Links namespace creation.
export const actionLinks = {
	actions: new Map<
		string,
		(message: IMessage, params: string, instance?: Blaze.TemplateInstance | ((actionId: string, context: string) => void)) => void
	>(),
	register(
		name: string,
		fn: (message: IMessage, params: string, instance?: Blaze.TemplateInstance | ((actionId: string, context: string) => void)) => void,
	): void {
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
	run(method: string, message: IMessage, instance?: Blaze.TemplateInstance | ((actionId: string, context: string) => void)): void {
		const actionLink = message.actionLinks?.find((action) => action.method_id === method);

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
		Meteor.call('actionLinkHandler', name, message._id, (error: unknown) => {
			if (error && !ranClient) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});
	},
};
