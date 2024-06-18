import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import { useOTR } from '../../../../hooks/useOTR';
import { usePresence } from '../../../../hooks/usePresence';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import OTRComponent from './OTR';

const OTRWithData = (): ReactElement => {
	const { otr, otrState } = useOTR();
	const { closeTab } = useRoomToolbox();

	const peerUserPresence = usePresence(otr?.getPeerId());
	const userStatus = peerUserPresence?.status;
	const peerUsername = peerUserPresence?.username;
	const isOnline = !['offline', 'loading'].includes(userStatus || '');

	const handleStart = (): void => {
		otr?.handshake();
	};

	const handleEnd = (): void => {
		otr?.end();
	};

	const handleReset = (): void => {
		otr?.reset();
		otr?.handshake(true);
	};

	useEffect(() => {
		if (otrState !== OtrRoomState.ESTABLISHING) {
			return;
		}

		const timeout = setTimeout(() => {
			otr?.setState(OtrRoomState.TIMEOUT);
		}, 10000);

		return (): void => {
			clearTimeout(timeout);
		};
	}, [otr, otrState]);

	return (
		<OTRComponent
			isOnline={isOnline}
			onClickClose={closeTab}
			onClickStart={handleStart}
			onClickEnd={handleEnd}
			onClickRefresh={handleReset}
			otrState={otrState}
			peerUsername={peerUsername}
		/>
	);
};

export default OTRWithData;
