/* global processWebhookMessage */

import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Mutation {
		sendMessage(channelId: String!, content: String!): Message
	}
`;

export const resolver = {
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
