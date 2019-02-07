import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/channels/deleteChannel.graphqls';

const resolver = {
	Mutation: {
		deleteChannel: authenticated((root, { channelId }, { user }) => {
			const channel = RocketChat.models.Rooms.findOne({
				_id: channelId,
				t: 'c',
			});

			if (!channel) {
				throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
			}

			const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(channel._id, user._id);

			if (!sub) {
				throw new Error(`The user/callee is not in the channel "${ channel.name }.`);
			}

			if (!sub.open) {
				throw new Error(`The channel, ${ channel.name }, is already closed to the sender`);
			}

			Meteor.runAsUser(user._id, () => {
				Meteor.call('eraseRoom', channel._id);
			});

			return true;
		}),
	},
};

export {
	schema,
	resolver,
};
