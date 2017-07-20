import { authenticated } from '@accounts/graphql-api';
import AccountsServer from '@accounts/server';

import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelByName(name: String!, isDirect: Boolean!): Channel
	}
`;

export const resolver = {
	Query: {
		channelByName: authenticated(AccountsServer, (root, { name, isDirect }, { models }) => {
			const query = {
				name
			};

			if (isDirect === true) {
				query.c = 'd';
			}

			return models.Rooms.findOne(query, {
				fields: roomPublicFields
			});
		})
	}
};
