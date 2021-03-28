import React from 'react';

import RoomProvider from '../providers/RoomProvider';
import Room from './Room';

const RoomWithData = ({ _id }) => (
	<RoomProvider rid={_id}>
		<Room />
	</RoomProvider>
);

export default RoomWithData;
