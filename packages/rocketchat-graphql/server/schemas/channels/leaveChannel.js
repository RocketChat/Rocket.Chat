import { Meteor } from 'meteor/meteor';

import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Mutation {
		leaveChannel(channelId: String!): Boolean
	}
`;

export const resolver = {
	Mutation: {
		leaveChannel: authenticated((root, args, { models, user }) => {
			const channel = models.Rooms.findOne({
				_id: args.channelId,
				t: 'c'
			});

			if (!channel) {
				throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
			}

			Meteor.runAsUser(user._id, () => {
				Meteor.call('leaveRoom', channel._id);
			});

			return true;
		})
	}
};
