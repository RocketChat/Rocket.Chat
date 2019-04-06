import { CachedChatRoom } from './CachedChatRoom';

export const ChatRoom = CachedChatRoom.collection;

ChatRoom.setReactionsInLastMessage = function(roomId, lastMessage) {
	return this.update({ _id: roomId }, { $set: { lastMessage } });
};

ChatRoom.unsetReactionsInLastMessage = function(roomId) {
	return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
};

ChatRoom.findOneLivechatById = function(_id, fields) {
	const options = {};

	if (fields) {
		options.fields = fields;
	}

	const query = {
		t: 'l',
		_id,
	};

	return this.findOne(query, options);
};
