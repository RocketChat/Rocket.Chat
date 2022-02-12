import React, { ReactElement } from 'react';

import { useRoom } from '../../../../../room/contexts/RoomContext';
import { VoipInfo } from './VoipInfo';

const VoipInfoWithData = ({ tabBar: { close } }: any): ReactElement => {
	const room = useRoom();
	console.log(room);
	const { servedBy } = room;

	const guest = {};

	const onClickReport = (): void => {
		// TODO: report
	};

	const onClickCall = (): void => {
		// TODO: Call
	};

	return <VoipInfo servedBy={servedBy} guest={guest} onClickClose={close} onClickReport={onClickReport} onClickCall={onClickCall} />;
};

export default VoipInfoWithData;
