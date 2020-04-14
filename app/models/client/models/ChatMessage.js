import { CachedCollection } from '../../../ui-cached-collection';

export const CachedChatMessage = new CachedCollection({ name: 'chatMessage' });

export const ChatMessage = CachedChatMessage.collection;

ChatMessage.setReactions = function(messageId, reactions) {
	this.update({ _id: messageId }, { $set: { reactions } });
	return CachedChatMessage.save();
};

ChatMessage.unsetReactions = function(messageId) {
	this.update({ _id: messageId }, { $unset: { reactions: 1 } });
	return CachedChatMessage.save();
};
