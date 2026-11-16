import type { IMessage } from '@rocket.chat/core-typings';
import { useContext, useEffect, useSyncExternalStore } from 'react';

import { SelectedMessageContext } from '../../providers/SelectedMessagesContext';

/**
 * Counts a message of the room's list in "Select all" while it is rendered and not selected yet. The messages draw
 * themselves from the room's selection but do not register in it, so the list that renders them does.
 */
export const useRegisterRenderedMessage = (messageId: IMessage['_id']) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const isSelected = useSyncExternalStore(
		(onChange) => selectedMessageStore.on('change', onChange),
		() => selectedMessageStore.isSelected(messageId),
	);

	useEffect(() => {
		if (isSelected) {
			return;
		}

		selectedMessageStore.addAvailableMessage(messageId);

		return () => selectedMessageStore.removeAvailableMessage(messageId);
	}, [selectedMessageStore, messageId, isSelected]);
};
