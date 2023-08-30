import React from 'react';

import { useRoom } from '../../../contexts/RoomContext';
import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';
import EditChannel from './EditChannel';

function EditChannelWithData({ onClickBack }) {
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	return <EditChannel onClickClose={closeTab} onClickBack={onClickBack} room={{ type: room?.t, ...room }} />;
}

export default EditChannelWithData;
