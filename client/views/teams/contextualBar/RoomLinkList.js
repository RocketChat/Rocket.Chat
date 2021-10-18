import React from 'react';

import { roomTypes } from '../../../../app/utils/client';

const RoomLinkList = ({ rooms }) => {
	const roomsArray = Object.values(rooms);
	return roomsArray.map((room, i) => (
		<React.Fragment key={i}>
			<a href={roomTypes.getRouteLink(room.t, room)}>#{roomTypes.getRoomName(room.t, room)}</a>
			{i === roomsArray.length - 1 ? '.' : ', '}
		</React.Fragment>
	));
};

export default RoomLinkList;
