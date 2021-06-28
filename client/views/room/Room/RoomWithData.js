import React from 'react';

import { useOpenedRoom } from '../../../lib/RoomManager';
import RoomProvider from '../providers/RoomProvider';
import { VoiceRoomProvider } from '../providers/VoiceRoomProvider';
import Room from './Room';

const RoomWithData = () => {
	const rid = useOpenedRoom();
	return rid ? (
		<RoomProvider rid={rid}>
			<VoiceRoomProvider>
				<Room />
			</VoiceRoomProvider>
		</RoomProvider>
	) : null;
};

export default RoomWithData;
