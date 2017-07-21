import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelByName(name: String!, isDirect: Boolean!): Channel
	}
`;

export const resolver = {
	Query: {
		channelByName: authenticated((root, { name, isDirect }, { models }) => {
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
