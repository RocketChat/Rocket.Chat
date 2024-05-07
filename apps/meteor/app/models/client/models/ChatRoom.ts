import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { CachedChatRoom } from './CachedChatRoom';

/** @deprecated */
export const ChatRoom = Object.assign(CachedChatRoom.collection, {
	setReactionsInLastMessage(this: typeof CachedChatRoom.collection, roomId: IRoom['_id'], lastMessage: IMessage) {
		return this.update({ _id: roomId }, { $set: { lastMessage } });
	},
	unsetReactionsInLastMessage(this: typeof CachedChatRoom.collection, roomId: IRoom['_id']) {
		return this.update({ _id: roomId }, { $unset: { 'lastMessage.reactions': 1 as const } });
	},
});
