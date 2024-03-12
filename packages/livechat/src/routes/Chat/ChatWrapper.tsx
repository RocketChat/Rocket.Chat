import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import type { FunctionalComponent } from 'preact';
import { route } from 'preact-router';
import { useEffect } from 'preact/hooks';

import {
	useAgentChangeSubscription,
	useAgentStatusChangeSubscription,
	useQueuePositionChangeSubscription,
} from '../../hooks/livechatRoomSubscriptionHooks';
import { useDeleteMessageSubscription } from '../../hooks/useDeleteMessageSubscription';
import { useRoomMessagesSubscription } from '../../hooks/useRoomMessagesSubscription';
import { useUserActivitySubscription } from '../../hooks/useUserActivitySubscription';
import { loadMessages } from '../../lib/room';
import { useStore } from '../../store';

export const ChatWrapper: FunctionalComponent<{}> = ({ children }) => {
	const { room: { _id: rid } = {}, user: { _id: uid } = {}, token, department } = useStore();

	const connection = useConnectionStatus();

	useRoomMessagesSubscription(rid);

	useUserActivitySubscription(rid);

	useDeleteMessageSubscription(rid);

	useAgentChangeSubscription(rid);

	useAgentStatusChangeSubscription(rid);

	useQueuePositionChangeSubscription(rid);

	useEffect(() => {
		if (connection.status !== 'connected') return;
		loadMessages();
	}, [rid, uid, token, department, connection.status]);

	useEffect(() => {
		// Cross-tab communication
		// Detects when a room is created and then route to the correct container
		route(`/`);
	}, [rid]);

	return <>{children}</>;
};
