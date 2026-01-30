import { useSetModal } from '@rocket.chat/ui-contexts';

import DeleteRoomModal from '../ABACRoomsTab/DeleteRoomModal';

export const useDeleteRoomModal = (room: { rid: string; name: string }) => {
	const setModal = useSetModal();

	return () => {
		setModal(<DeleteRoomModal rid={room.rid} roomName={room.name} onClose={() => setModal(null)} />);
	};
};
