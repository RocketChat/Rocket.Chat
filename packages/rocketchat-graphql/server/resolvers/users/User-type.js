import { property } from '../../helpers/property';
import schema from '../../schemas/users/User-type.graphql';

const resolver = {
	User: {
		id: property('_id'),
		status: ({status}) => status.toUpperCase(),
		avatar: async({ _id }) => {
			const avatar = RocketChat.models.Avatars.findOne({
				userId: _id
			}, { fields: { url: 1 }});

			if (avatar) {
				return avatar.url;
			}
		},
		channels: ({ _id }) => {
			return RocketChat.models.Rooms.findBySubscriptionUserId(_id).fetch();
		},
		directMessages: ({ username }) => {
			return RocketChat.models.Rooms.findByTypeContainingUsername('d', username).fetch();
		}
	}
};

export {
	schema,
	resolver
};
