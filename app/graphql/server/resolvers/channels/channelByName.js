import { roomPublicFields } from './settings';
import { Rooms } from '../../../../models';
import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/channels/channelByName.graphqls';

const resolver = {
	Query: {
		channelByName: authenticated((root, { name }) => {
			const query = {
				name,
				t: 'c',
			};

			return Rooms.findOne(query, {
				fields: roomPublicFields,
			});
		}),
	},
};

export {
	schema,
	resolver,
};
