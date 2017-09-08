import { withFilter } from 'graphql-subscriptions';
import { RocketChat } from 'meteor/rocketchat:lib';

import { pubsub } from '../../subscriptions';
import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/chatMessageAdded.graphqls';

export const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';

export function publishMessage(message) {
	pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, { chatMessageAdded: message });
}

function shouldPublish(message, { id, directTo }, username) {
	if (id) {
		return message.rid === id;
	} else if (directTo) {
		const room = RocketChat.models.Rooms.findOne({
			usernames: { $all: [directTo, username] },
			t: 'd'
		});

		return room && room._id === message.rid;
	}

	return false;
}

const resolver = {
	Subscription: {
		chatMessageAdded: {
			subscribe: withFilter(() => pubsub.asyncIterator(CHAT_MESSAGE_SUBSCRIPTION_TOPIC), authenticated((payload, args, { user }) => {
				const channel = {
					id: args.channelId,
					directTo: args.directTo
				};

				return shouldPublish(payload.chatMessageAdded, channel, user.username);
			}))
		}
	}
};

RocketChat.callbacks.add('afterSaveMessage', (message) => {
	publishMessage(message);
}, null, 'chatMessageAddedSubscription');

export {
	schema,
	resolver
};
