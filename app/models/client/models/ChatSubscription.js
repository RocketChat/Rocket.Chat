import { CachedChatSubscription } from './CachedChatSubscription';

export const ChatSubscription = CachedChatSubscription.collection;

ChatSubscription.setLastMessage = function(roomId, lastMessage) {
	const update = this.update({ rid: roomId }, { $set: { lastMessage } });
	CachedChatSubscription.save();
	return update;
};
