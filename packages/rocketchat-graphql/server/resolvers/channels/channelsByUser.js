import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import { roomPublicFields } from './settings';
import schema from '../../schemas/channels/channelsByUser.graphqls';

const resolver = {
	Query: {
		channelsByUser: authenticated((root, { userId }) => {
			const user = RocketChat.models.Users.findOneById(userId);

			if (!user) {
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

export {
	schema,
	resolver
};
