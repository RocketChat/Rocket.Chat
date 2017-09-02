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
			subscribe: withFilter(() => pubsub.asyncIterator(CHAT_MESSAGE_SUBSCRIPTION_TOPIC), (payload, args, ctx) => {
				// FIX: there's no authToken in context
				// TODO: check if middleware applies to subscriptions, probably not.
				const channel = {
					id: args.channelId,
					directTo: args.directTo
				};

				console.log('context in sub', ctx);

				return shouldPublish(payload.chatMessageAdded, channel, ctx.user.username);
			})
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
