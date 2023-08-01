import { useUserRoom } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useRoomToolbox } from '../../../contexts/RoomToolboxContext';
import EditChannel from './EditChannel';

function EditChannelWithData({ rid, onClickBack }) {
	const room = useUserRoom(rid);
	const { closeTab } = useRoomToolbox();

	return <EditChannel onClickClose={closeTab} onClickBack={onClickBack} room={{ type: room?.t, ...room }} />;
}

export default EditChannelWithData;
