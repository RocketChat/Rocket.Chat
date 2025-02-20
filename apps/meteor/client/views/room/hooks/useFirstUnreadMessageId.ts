import { useSyncExternalStore } from 'react';

import { useChat } from '../contexts/ChatContext';

export const useFirstUnreadMessageId = (): string | undefined => {
	const chat = useChat();

	if (!chat) {
		throw new Error('useFirstUnreadMessageId must be used within a ChatContextProvider');
	}

	return useSyncExternalStore(chat.readStateManager.onUnreadStateChange, chat.readStateManager.getFirstUnreadRecordId);
};
