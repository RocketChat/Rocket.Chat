import React from 'react';

import { roomTypes } from '../../../../../app/utils';

const RoomLinkList = ({ rooms }) => Object.values(rooms).map((room, i) => <>
	<a href={roomTypes.getRouteLink(room.t, room)}>
		{roomTypes.getRoomName(room.t, room)}
	</a>
	{i === rooms.length - 1 ? '.' : ', '}
</>);

export default RoomLinkList;
