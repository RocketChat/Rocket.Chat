import { useStore } from '../store';

export const useRoomId = () => {
	const { room } = useStore();
	return room?._id;
};
