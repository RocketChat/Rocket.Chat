import { withFilter } from 'graphql-subscriptions';

import { pubsub } from '../../subscriptions';

export const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';

export function publishMessage(message) {
	pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, { chatMessageAdded: message });
}

export const schema = `
	type Subscription {
    chatMessageAdded(channelId: String!): Message
	}
`;

export const resolver = {
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
