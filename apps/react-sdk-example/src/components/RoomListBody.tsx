import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import Header from './Header';

const RoomListBody = ({ children }: { children: React.ReactNode }) => {
	return (
		<Box
			width={250}
			h='full'
			display='flex'
			flexDirection='column'
			borderInlineEnd='1px solid'
			borderInlineColor='extra-light'
			overflowX='hidden'
			overflowY='scroll'
		>
			<Header>Rooms</Header>
			<Box is='ul' width='full' h='full' display='flex' flexDirection='column'>
				{children}
			</Box>
		</Box>
	);
};

export default RoomListBody;
