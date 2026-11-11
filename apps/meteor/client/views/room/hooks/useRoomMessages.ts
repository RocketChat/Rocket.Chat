import { useRoomHistoryState } from '../../../lib/RoomHistoryManager';
import { useRoom } from '../contexts/RoomContext';

export const useRoomMessages = () => {
	const { _id: rid } = useRoom();

	const hasMorePreviousMessages = useRoomHistoryState(rid, (state) => state.hasMore);
	const hasMoreNextMessages = useRoomHistoryState(rid, (state) => state.hasMoreNext);
	const isLoadingMoreMessages = useRoomHistoryState(rid, (state) => state.isLoading);

	return { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages };
};
