import { IRoom } from '@rocket.chat/core-typings';
import React, { ReactElement, useCallback, useEffect, useMemo } from 'react';

import ORTInstance from '../../../../../app/otr/client/OTR';
import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import { usePresence } from '../../../../hooks/usePresence';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import OTR from './OTR';

const OTRWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const closeTabBar = useTabBarClose();
	const otr = useMemo(() => ORTInstance.getInstanceByRoomId(rid), [rid]);
	const otrState = useReactiveValue(useCallback(() => (otr ? otr.getState() : OtrRoomState.ERROR), [otr]));
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
		<OTR
			isOnline={isOnline}
			onClickClose={closeTabBar}
			onClickStart={handleStart}
			onClickEnd={handleEnd}
			onClickRefresh={handleReset}
			otrState={otrState}
			peerUsername={peerUsername}
		/>
	);
};

export default OTRWithData;
