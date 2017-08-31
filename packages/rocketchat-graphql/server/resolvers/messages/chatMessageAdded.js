import { withFilter } from 'graphql-subscriptions';

import { pubsub } from '../../subscriptions';
import schema from '../../schemas/messages/chatMessageAdded.graphql';

export const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';

export function publishMessage(message) {
	pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, { chatMessageAdded: message });
}

const resolver = {
	Subscription: {
		chatMessageAdded: {
			subscribe: withFilter(() => pubsub.asyncIterator(CHAT_MESSAGE_SUBSCRIPTION_TOPIC), (payload, args) => {
				return payload.chatMessageAdded.rid === args.channelId;
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
