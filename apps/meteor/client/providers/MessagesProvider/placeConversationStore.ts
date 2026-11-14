import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { MessageConversation } from '@rocket.chat/ui-message-list';
import isEqual from 'lodash/isEqual';

export type MessagePlace = { room?: IRoom; subscription?: ISubscription };

/**
 * The room and subscription of a place, held apart from the provider's value so that a change of either reaches only the
 * readers that selected something it changed. A copy equal to what is held replaces nothing.
 */
export type PlaceConversationStore = {
	/** Makes `place` the one readers see now, so a row that renders in the same pass as its provider reads it. */
	replace: (place: MessagePlace) => void;
	/** Tells the readers of what `replace` changed since the last time. */
	flush: () => void;
	getRoomId: () => IRoom['_id'] | undefined;
	getConversation: () => MessageConversation;
	subscribe: (onStoreChange: () => void) => () => void;
};

export const createPlaceConversationStore = (place: MessagePlace): PlaceConversationStore => {
	let conversation: MessageConversation = { room: place.room, subscription: place.subscription };
	let hasChanged = false;
	const listeners = new Set<() => void>();

	return {
		replace: ({ room, subscription }) => {
			if (isEqual(conversation.room, room) && isEqual(conversation.subscription, subscription)) {
				return;
			}
			conversation = { room, subscription };
			hasChanged = true;
		},
		flush: () => {
			if (!hasChanged) {
				return;
			}
			hasChanged = false;
			listeners.forEach((listener) => listener());
		},
		getRoomId: () => conversation.room?._id,
		getConversation: () => conversation,
		subscribe: (onStoreChange) => {
			listeners.add(onStoreChange);
			return () => listeners.delete(onStoreChange);
		},
	};
};
