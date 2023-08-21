import { useEffect, useState } from 'react';

import { useChat } from '../contexts/ChatContext';
import { useRoomSubscription } from '../contexts/RoomContext';

export const useReadStateManager = (): string | undefined => {
	const chat = useChat();
	const [unreadId, setUnreadId] = useState<string | undefined>();

	const subscription = useRoomSubscription();

	useEffect(() => {
		if (subscription) {
			chat?.readStateManager.updateSubscription(subscription);
		}
	}, [subscription, chat?.readStateManager]);

	useEffect(() => {
		const unsub = chat?.readStateManager.onUnreadStateChange((id) => setUnreadId(id));
		return unsub;
	}, [chat?.readStateManager]);

	return unreadId;
};
