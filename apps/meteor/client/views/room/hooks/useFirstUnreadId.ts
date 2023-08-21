import { useEffect, useState } from 'react';

import { useChat } from '../contexts/ChatContext';

export const useFirstUnreadId = (): string | undefined => {
	const chat = useChat();
	const [unreadId, setUnreadId] = useState<string | undefined>();

	useEffect(() => {
		const unsub = chat?.readStateManager.onUnreadStateChange((id) => setUnreadId(id));
		return unsub;
	}, [chat?.readStateManager, setUnreadId]);

	return unreadId;
};
