/* global processWebhookMessage */

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/sendMessage.graphqls';

const resolver = {
	Mutation: {
		sendMessage: authenticated((root, { channelId, directTo, content }, { user }) => {
			const options = {
				text: content,
				channel: channelId || directTo
			};

			const messageReturn = processWebhookMessage(options, user)[0];

			if (!messageReturn) {
				throw new Error('Unknown error');
			}

			return messageReturn.message;
		})
	}
};

export {
	schema,
	resolver
};
