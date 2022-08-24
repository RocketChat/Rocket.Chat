import React, { ReactElement } from 'react';

import { useOpenedRoom } from '../../../lib/RoomManager';
import RoomProvider from '../providers/RoomProvider';
import Room from './Room';

const RoomWithData = (): ReactElement | null => {
	const rid = useOpenedRoom();

	if (!rid) {
		return null;
	}

	return (
		<RoomProvider rid={rid}>
			<Room />
		</RoomProvider>
	);
};

export default RoomWithData;
