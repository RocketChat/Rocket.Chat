import { authenticated } from '@accounts/graphql-api';
import AccountsServer from '@accounts/server';

import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelsByUser(userId: String!): [Channel]
	}
`;

export const resolver = {
	Query: {
		channelsByUser: authenticated(AccountsServer, (root, { userId }, { models }) => {
			const user = models.Users.findOneById(userId);

			if (!user) {
				// TODO:
				throw new Error('No user');
			}

			return models.Rooms.find({
				'usernames': {
					$in: user.username
				}
			}, {
				sort: {
					name: 1
				},
				fields: roomPublicFields
			}).fetch();
		})
	}
};
