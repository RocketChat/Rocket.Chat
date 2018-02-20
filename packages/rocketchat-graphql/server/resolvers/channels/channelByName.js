import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';
import schema from '../../schemas/channels/channelByName.graphqls';

const resolver = {
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

export {
	schema,
	resolver
};
