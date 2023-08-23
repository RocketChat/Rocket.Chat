import React from 'react';

import { useVoipRoom } from '../../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../../room/contexts/RoomToolboxContext';
import { VoipInfo } from './VoipInfo';

// Contextual Bar for room view
const VoipInfoWithData = () => {
	const room = useVoipRoom();
	const { closeTab } = useRoomToolbox();

	return <VoipInfo room={room} onClickClose={closeTab} />;
};

export default VoipInfoWithData;
