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

			const roomIds = RocketChat.models.Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
			const rooms = RocketChat.models.Rooms.findByIds(roomIds, {
				sort: {
					name: 1,
				},
				fields: roomPublicFields,
			}).fetch();

			return rooms;
		}),
	},
};

export {
	schema,
	resolver,
};
