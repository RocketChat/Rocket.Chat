import { useEffect } from 'react';

import { useChat } from '../../contexts/ChatContext';

export function useReadMessageWindowEvents() {
	const chat = useChat();

	useEffect(() => {
		const unsub = chat?.readStateManager.handleWindowEvents();
		return unsub;
	}, [chat?.readStateManager]);
}
