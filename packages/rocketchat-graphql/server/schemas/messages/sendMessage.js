/* global processWebhookMessage */

import { authenticated } from '../../mocks/accounts/graphql-api';
import AccountsServer from '../../mocks/accounts/server';

export const schema = `
	type Mutation {
		sendMessage(channelId: String!, content: String!): Message
	}
`;

export const resolver = {
	Mutation: {
		sendMessage: authenticated(AccountsServer, (root, { channelId, content }, { user }) => {
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
