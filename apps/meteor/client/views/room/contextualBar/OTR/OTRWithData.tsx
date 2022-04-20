import { IRoom } from '@rocket.chat/core-typings';
import React, { useEffect, useMemo, useCallback, ReactElement } from 'react';

import { OtrRoomState } from '../../../../../app/otr/client/OtrRoomState';
import { OTR as ORTInstance } from '../../../../../app/otr/client/rocketchat.otr';
import { usePresence } from '../../../../hooks/usePresence';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import OTR from './OTR';

const OTRWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const closeTabBar = useTabBarClose();
	const otr = useMemo(() => ORTInstance.getInstanceByRoomId(rid), [rid]);
	const otrState = useReactiveValue(useCallback(() => (otr ? otr.state.get() : OtrRoomState.ERROR), [otr]));
	const peerUserPresence = usePresence(otr.peerId);
	const userStatus = peerUserPresence?.status;
	const peerUsername = peerUserPresence?.username;
	const isOnline = !['offline', 'loading'].includes(userStatus || '');

	const handleStart = (): void => {
		otr.handshake();
	};

	const handleEnd = (): void => {
		otr?.end();
	};

	const handleReset = (): void => {
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
