import { roomPublicFields } from './settings';
import { Users, Subscriptions, Rooms } from '../../../../models';
import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/channels/channelsByUser.graphqls';

const resolver = {
	Query: {
		channelsByUser: authenticated((root, { userId }) => {
			const user = Users.findOneById(userId);

			if (!user) {
				throw new Error('No user');
			}

			const roomIds = Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
			const rooms = Rooms.findByIds(roomIds, {
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
