import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useCallback } from 'react';

import { OtrRoomState } from '../../../../../app/otr/client/OtrRoomState';
import { OTR as ORTInstance } from '../../../../../app/otr/client/rocketchat.otr';
import { usePresence } from '../../../../hooks/usePresence';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import OTR from './OTR';

const OTRWithData = ({ rid, tabBar }) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());

	const otr = useMemo(() => ORTInstance.getInstanceByRoomId(rid), [rid]);

	const otrState = useReactiveValue(useCallback(() => (otr ? otr.state.get() : OtrRoomState.ERROR), [otr]));

	const peerUserPresence = usePresence(otr.peerId);

	const userStatus = peerUserPresence?.status;

	const peerUsername = peerUserPresence?.username;

	const isOnline = !['offline', 'loading'].includes(userStatus);

	const handleStart = () => {
		otr.handshake();
	};

	const handleEnd = () => otr?.end();

	const handleReset = () => {
		otr.reset();
		otr.handshake(true);
	};

	useEffect(() => {
		if (otrState !== OtrRoomState.ESTABLISHING) {
			return;
		}

		const timeout = setTimeout(() => {
			otr.state.set(OtrRoomState.TIMEOUT);
		}, 10000);

		return () => clearTimeout(timeout);
	}, [otr, otrState]);

	return (
		<OTR
			isOnline={isOnline}
			onClickClose={onClickClose}
			onClickStart={handleStart}
			onClickEnd={handleEnd}
			onClickRefresh={handleReset}
			otrState={otrState}
			peerUsername={peerUsername}
		/>
	);
};

export default OTRWithData;
