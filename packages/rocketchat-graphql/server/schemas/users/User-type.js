import {
	property
} from '../../helpers/property';

export const schema = `
  extend type User {
    status: UserStatus
    avatar: String
    name: String
    lastLogin: String
    channels: [Channel]
    directMessages: [Channel]
  }
`;

export const resolver = {
	User: {
		id: property('_id'),
		status: ({status}) => status.toUpperCase(),
		avatar: ({ _id}, args, { models }) => {
			const avatar = models.Avatars.findOne({
				userId: _id
			}, { fields: { url: 1 }});

			if (avatar) {
				return avatar.url;
			}
		},
		channels: ({ _id }, args, { models }) => {
			return models.Rooms.findBySubscriptionUserId(_id).fetch();
		},
		directMessages: ({ username }, args, { models }) => {
			return models.Rooms.findByTypeContainingUsername('d', username).fetch();
		}
	}
};
