import { Meteor } from 'meteor/meteor';
import { authenticated } from '@accounts/graphql-api';
import AccountsServer from '@accounts/server';

export const schema = `
	type Mutation {
		hideChannel(channelId: String!): Boolean
	}
`;

export const resolver = {
	Mutation: {
		hideChannel: authenticated(AccountsServer, (root, args, { models, user }) => {
			const channel = models.Rooms.findOne({
				_id: args.channelId,
				t: 'c'
			});

			if (!channel) {
				throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
			}

			const sub = models.Subscriptions.findOneByRoomIdAndUserId(channel._id, user._id);

			if (!sub) {
				throw new Error(`The user/callee is not in the channel "${ channel.name }.`);
			}

			if (!sub.open) {
				throw new Error(`The channel, ${ channel.name }, is already closed to the sender`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', channel._id);
			});

			return true;
		})
	}
};
