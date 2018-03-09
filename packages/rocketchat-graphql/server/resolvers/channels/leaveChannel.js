import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/channels/leaveChannel.graphqls';

const resolver = {
	Mutation: {
		leaveChannel: authenticated((root, args, { user }) => {
			const channel = RocketChat.models.Rooms.findOne({
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

export {
	schema,
	resolver
};
