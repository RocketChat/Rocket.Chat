import { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { getMessageForUser } from '../../../../server/lib/messages/getMessageForUser';

function getMessageById(messageId: string): IMessage | undefined {
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
	actions: {} as { [key: string]: Function },
	register(name: string, funct: Function): void {
		actionLinks.actions[name] = funct;
	},
	getMessage(name: string, messageId: string): IMessage | undefined {
		const message = getMessageById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				function: 'actionLinks.getMessage',
			});
		}

		if (!message.actionLinks || !message.actionLinks.some((action) => action.method_id === name)) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
				function: 'actionLinks.getMessage',
			});
		}

		return message;
	},
};
