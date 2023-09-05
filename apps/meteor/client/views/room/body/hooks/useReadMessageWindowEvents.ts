import { useEffect } from 'react';

import { useChat } from '../../contexts/ChatContext';

export function useReadMessageWindowEvents() {
	const chat = useChat();

	useEffect(() => {
		return chat?.readStateManager.handleWindowEvents();
	}, [chat?.readStateManager]);
}
