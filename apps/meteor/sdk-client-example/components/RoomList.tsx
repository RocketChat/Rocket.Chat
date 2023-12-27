import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Box, Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import Header from './Header';

const RoomList = ({ sdk, setRoomId, roomId }: { roomId: string; sdk: DDPSDK; setRoomId: (id: string) => void }) => {
	const [subscriptions, setSubscriptions] = useState<Record<string, any>[]>([]);

	useEffect(() => {
		const fetchRooms = async () => {
			// Example fetching the list of all subscribed rooms.
			const result = await sdk.rest.get('/v1/subscriptions.get', {});
			result.update && setSubscriptions(result.update);
		};
		void fetchRooms();
	}, [sdk]);

	return (
		<Box width={250} h='full' display='flex' flexDirection='column' borderInlineEnd='1px solid' borderInlineColor='extra-light'>
			<Header>Rooms</Header>
			<Box is='ul' width='full' h='full' display='flex' flexDirection='column'>
				{subscriptions.map((sub) => {
					return (
						<Box
							is='li'
							backgroundColor={roomId === sub.rid ? 'surface-hover' : 'none'}
							key={sub._id}
							p={16}
							cursor='pointer'
							onClick={() => setRoomId(sub.rid)}
							style={{ cursor: 'pointer' }}
						>
							{sub.t === 'p' ? <Icon name='hashtag-lock' /> : <Icon name='hashtag' />} {sub.fname || sub.name}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export default RoomList;
