import { useSetModal } from '@rocket.chat/ui-contexts';

import ABACDeleteRoomModal from '../ABACDeleteRoomModal';

const useABACDeleteRoomModal = (room: { rid: string; name: string }) => {
	const setModal = useSetModal();

	return () => {
		setModal(<ABACDeleteRoomModal rid={room.rid} roomName={room.name} onClose={() => setModal(null)} />);
	};
};

export default useABACDeleteRoomModal;
