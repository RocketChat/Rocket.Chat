import React from 'react';

import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

const RoomLinkList = ({ rooms }) => {
	const roomsArray = Object.values(rooms);
	return roomsArray.map((room, i) => (
		<React.Fragment key={i}>
			<a href={roomCoordinator.getRouteLink(room.t, room)}>#{roomCoordinator.getRoomName(room.t, room)}</a>
			{i === roomsArray.length - 1 ? '.' : ', '}
		</React.Fragment>
	));
};

export default RoomLinkList;
