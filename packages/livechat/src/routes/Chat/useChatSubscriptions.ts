import {
	useAgentChangeSubscription,
	useAgentStatusChangeSubscription,
	useQueuePositionChangeSubscription,
} from '../../hooks/livechatRoomSubscriptionHooks';
import { useDeleteMessageSubscription } from '../../hooks/useDeleteMessageSubscription';
import { useRoomMessagesSubscription } from '../../hooks/useRoomMessagesSubscription';
import { useUserActivitySubscription } from '../../hooks/useUserActivitySubscription';
import { useStore } from '../../store';

export const useChatSubscriptions = () => {
	const { token, room } = useStore();
	const rid = room?._id || '';

	useRoomMessagesSubscription(rid, token);
	useUserActivitySubscription(rid);
	useDeleteMessageSubscription(rid);
	useAgentChangeSubscription(rid);
	useAgentStatusChangeSubscription(rid);
	useQueuePositionChangeSubscription(rid);
};
