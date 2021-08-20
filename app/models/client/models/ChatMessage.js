import { Mongo } from 'meteor/mongo';

export const ChatMessage = new Mongo.Collection(null);

ChatMessage.setReactions = function(messageId, reactions) {
	return this.update({ _id: messageId }, { $set: { reactions } });
};

ChatMessage.unsetReactions = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { reactions: 1 } });
};

ChatMessage.findOneByRoomIdAndMessageId = function(rid, messageId, options) {
	const query = {
		rid,
		_id: messageId,
	};

	return this.findOne(query, options);
};
