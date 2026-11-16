import { useSyncExternalStore } from 'react';

import { getSnapshot, subscribe } from '../../views/room/MessageList/providers/messageHighlightSubscription';

/** The message to draw with the editing look: the one being edited or the one a jump just landed on, in places a conversation is in. */
export const useMessageEditingValue = (allowsInteraction: boolean) => {
	const highlightedMessageId = useSyncExternalStore(subscribe, getSnapshot);

	return allowsInteraction ? highlightedMessageId : undefined;
};
