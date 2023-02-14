import type { ReactElement } from 'react';
import React from 'react';

import { useVoipRoom } from '../../../../room/contexts/RoomContext';
import { VoipInfo } from './VoipInfo';

// Contextual Bar for room view
const VoipInfoWithData = ({ tabBar: { close } }: any): ReactElement => {
	const room = useVoipRoom();

	return <VoipInfo room={room} onClickClose={close} />;
};

export default VoipInfoWithData;
