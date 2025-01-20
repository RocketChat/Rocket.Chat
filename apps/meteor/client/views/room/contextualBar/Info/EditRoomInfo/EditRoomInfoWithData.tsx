import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';

import EditRoomInfo from './EditRoomInfo';
import { useRoom } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';

const EditRoomInfoWithData = ({ onClickBack }: { onClickBack: () => void }) => {
	const room = useRoom() as IRoomWithRetentionPolicy;
	const { closeTab } = useRoomToolbox();

	return <EditRoomInfo onClickClose={closeTab} onClickBack={onClickBack} room={room} />;
};

export default EditRoomInfoWithData;
