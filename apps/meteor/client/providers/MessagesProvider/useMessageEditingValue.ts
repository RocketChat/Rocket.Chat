import { useSyncExternalStore } from 'react';

import { getSnapshot, subscribe } from '../../lib/chats/editingMessageSubscription';

/** The message to draw with the editing look: the one being edited, in places a conversation is in. */
export const useMessageEditingValue = (allowsInteraction: boolean) => {
	const editingMessageId = useSyncExternalStore(subscribe, getSnapshot);

	return allowsInteraction ? editingMessageId : undefined;
};
