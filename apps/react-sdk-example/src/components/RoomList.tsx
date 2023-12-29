import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useUserSubscriptions } from '../hooks/useUserSubscriptions';
import RoomListItem from './RoomListItem';
import RoomListBody from './RoomListBody';

const RoomList = ({ setRoomId, roomId }: { roomId: string; setRoomId: (id: string) => void }) => {
	const subscriptions = useUserSubscriptions();

	if (subscriptions.status === 'loading') {
		return <Box>Loading...</Box>;
	}

	if (subscriptions.status === 'error') {
		return <Box>Error...</Box>;
	}

	return (
		<RoomListBody>
			{subscriptions.data.map((sub) => (
				<RoomListItem sub={sub} setRoomId={setRoomId} roomId={roomId} />
			))}
		</RoomListBody>
	);
};

export default RoomList;
