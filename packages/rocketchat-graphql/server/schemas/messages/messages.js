import { authenticated } from '../../mocks/accounts/graphql-api';
import AccountsServer from '../../mocks/accounts/server';

export const schema = `
	type Query {
		messages(channelId: String): MessagesWithCursor
	}
`;

export const resolver = {
	Query: {
		messages: authenticated(AccountsServer, (root, args, { models }) => {
			if (!args.channelId) {
				console.error('messages query must be called with channelId');
				return null;
			}

			const query = {};

			if (args.channelId) {
				query.rid = args.channelId;
			}

			const messagesArray = models.Messages.find(query).fetch();
			const channel = models.Rooms.findOne(args.channelId);

			return {
				cursor: 'CURSOR',
				channel,
				messagesArray
			};
		})
	}
};
