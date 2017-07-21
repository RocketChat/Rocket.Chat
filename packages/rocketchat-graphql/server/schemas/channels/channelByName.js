import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';

export const schema = `
	type Query {
		channelByName(name: String!, isDirect: Boolean!): Channel
	}
`;

export const resolver = {
	Query: {
		channelByName: authenticated((root, { name, isDirect }) => {
			const query = {
				name
			};

			if (isDirect === true) {
				query.c = 'd';
			}

			return RocketChat.models.Rooms.findOne(query, {
				fields: roomPublicFields
			});
		})
	}
};
