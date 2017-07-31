import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelByName(name: String!): Channel
	}
`;

export const resolver = {
	Query: {
		channelByName: authenticated((root, { name }) => {
			const query = {
				name,
				t: 'c'
			};

			return RocketChat.models.Rooms.findOne(query, {
				fields: roomPublicFields
			});
		})
	}
};
