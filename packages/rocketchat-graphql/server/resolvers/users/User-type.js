import { RocketChat } from 'meteor/rocketchat:lib';
import property from 'lodash.property';

import schema from '../../schemas/users/User-type.graphqls';

const resolver = {
	User: {
		id: property('_id'),
		status: ({status}) => status.toUpperCase(),
		avatar: async({ _id }) => {
			// XXX js-accounts/graphql#16
			const avatar = await RocketChat.models.Avatars.model.rawCollection().findOne({
				userId: _id
			}, { fields: { url: 1 }});

			if (avatar) {
				return avatar.url;
			}
		},
		channels: Meteor.bindEnvironment(async({ _id }) => {
			return await RocketChat.models.Rooms.findBySubscriptionUserId(_id).fetch();
		}),
		directMessages: ({ username }) => {
			return RocketChat.models.Rooms.findByTypeContainingUsername('d', username).fetch();
		}
	}
};

export {
	schema,
	resolver
};
