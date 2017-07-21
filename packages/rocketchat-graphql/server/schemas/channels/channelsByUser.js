import { authenticated } from '../../helpers/authenticated';

import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelsByUser(userId: String!): [Channel]
	}
`;

export const resolver = {
	Query: {
		channelsByUser: authenticated((root, { userId }, { models }) => {
			const user = models.Users.findOneById(userId);

			if (!user) {
				// TODO:
				throw new Error('No user');
			}

			// TODO: empty
			const rooms = models.Rooms.findByContainingUsername(user.username, {
				sort: {
					name: 1
				},
				fields: roomPublicFields
			}).fetch();

			console.log('user.username', user.username);
			console.log('rooms', rooms);

			return rooms;
		})
	}
};
