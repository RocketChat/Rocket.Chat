import { useUserPresence } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import OTRComponent from './OTR';
import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import { useOTR } from '../../../../hooks/useOTR';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const OTRWithData = (): ReactElement => {
	const { otr, otrState } = useOTR();
	const { closeTab } = useRoomToolbox();

	const peerUserPresence = useUserPresence(otr?.getPeerId());
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
