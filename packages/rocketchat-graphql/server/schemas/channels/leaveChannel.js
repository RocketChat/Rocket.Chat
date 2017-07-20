import { Meteor } from 'meteor/meteor';
import { authenticated } from '@accounts/graphql-api';
import AccountsServer from '@accounts/server';

export const schema = `
	type Mutation {
		leaveChannel(channelId: String!): Boolean
	}
`;

export const resolver = {
	Mutation: {
		leaveChannel: authenticated(AccountsServer, (root, args, { models, user }) => {
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
