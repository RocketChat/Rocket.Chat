import { authenticated } from '../../helpers/authenticated';

import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelsByUser(userId: String!): [Channel]
	}
`;

export const resolver = {
	Query: {
		channelsByUser: authenticated((root, { userId }) => {
			const user = RocketChat.models.Users.findOneById(userId);

			if (!user) {
				// TODO:
				throw new Error('No user');
			}

			const rooms = RocketChat.models.Rooms.findByContainingUsername(user.username, {
				sort: {
					name: 1
				},
				fields: roomPublicFields
			}).fetch();

			return rooms;
		})
	}
};
