import { lazy } from 'react';

import RoomHeader from './RoomHeader';
import type { RoomHeaderProps } from './RoomHeader';
import { E2ERoomState } from '../../../lib/e2ee/E2ERoomState';
import { useE2EERoomState } from '../hooks/useE2EERoomState';
import { useE2EEState } from '../hooks/useE2EEState';

const RoomToolboxE2EESetup = lazy(() => import('./RoomToolbox/RoomToolboxE2EESetup'));

const RoomHeaderE2EESetup = ({ room, slots = {} }: RoomHeaderProps) => {
	const e2eeState = useE2EEState();
	const e2eRoomState = useE2EERoomState(room._id);

	if (e2eeState === 'SAVE_PASSWORD' || e2eeState === 'ENTER_PASSWORD' || e2eRoomState === E2ERoomState.WAITING_KEYS) {
		return <RoomHeader room={room} slots={slots} roomToolbox={<RoomToolboxE2EESetup />} />;
	}

	return <RoomHeader room={room} slots={slots} />;
};

export default RoomHeaderE2EESetup;
