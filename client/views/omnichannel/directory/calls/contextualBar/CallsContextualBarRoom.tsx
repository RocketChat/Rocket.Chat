import React, { ReactElement } from 'react';

import { useVoipRoom } from '../../../../room/contexts/RoomContext';
import { VoipInfo } from './VoipInfo';

// Contextual Bar for room view
const VoipInfoWithData = ({ tabBar: { close } }: any): ReactElement => {
	const room = useVoipRoom();

	const onClickReport = (): void => {
		// TODO: report
	};

	const onClickCall = (): void => {
		// TODO: Call
	};

	return <VoipInfo room={room} onClickClose={close} onClickReport={onClickReport} onClickCall={onClickCall} />;
};

export default VoipInfoWithData;
