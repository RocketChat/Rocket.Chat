/* global processWebhookMessage */

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/sendMessage.graphql';

const resolver = {
	Mutation: {
		sendMessage: authenticated((root, { channelId, content }, { user }) => {
			const messageReturn = processWebhookMessage({
				roomId: channelId,
				text: content
			}, user)[0];

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
