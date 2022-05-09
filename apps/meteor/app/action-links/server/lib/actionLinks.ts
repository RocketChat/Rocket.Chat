import { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { getMessageForUser } from '../../../../server/lib/messages/getMessageForUser';

function getMessageById(messageId: IMessage['_id']): IMessage | undefined {
	try {
		const user = Meteor.userId();
		if (!user) {
			return;
		}
		return Promise.await(getMessageForUser(messageId, user));
	} catch (e) {
		throw new Meteor.Error(e.message, 'Invalid message', {
			function: 'actionLinks.getMessage',
		});
	}
}

type ActionLinkHandler = (message: IMessage, params?: string, instance?: undefined) => void;

// Action Links namespace creation.
export const actionLinks = {
	actions: {} as { [key: string]: ActionLinkHandler },
	register(name: string, funct: ActionLinkHandler): void {
		actionLinks.actions[name] = funct;
	},
	getMessage(name: string, messageId: IMessage['_id']): IMessage | undefined {
		const message = getMessageById(messageId);

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				function: 'actionLinks.getMessage',
			});
		}

		if (!message.actionLinks?.some((action) => action.method_id === name)) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
				function: 'actionLinks.getMessage',
			});
		}

		return message;
	},
};
