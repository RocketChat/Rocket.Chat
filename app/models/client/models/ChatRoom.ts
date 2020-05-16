/* eslint-disable  @typescript-eslint/explicit-function-return-type */
import { CachedChatRoom } from './CachedChatRoom';
import { IRoomsRepository } from '../../lib/IRoomsRepository';

export const ChatRoom: IRoomsRepository = CachedChatRoom.collection;

ChatRoom.setReactionsInLastMessage = function(roomId, lastMessage) {
	return this.update({ _id: roomId }, { $set: { lastMessage } });
};

ChatRoom.unsetReactionsInLastMessage = function(roomId) {
	return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
};
