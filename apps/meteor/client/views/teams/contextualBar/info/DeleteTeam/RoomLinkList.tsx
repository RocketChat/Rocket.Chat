import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import React, { Fragment } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

const RoomLinkList = ({ rooms }: { rooms: { [key: string]: Serialized<IRoom> } }) => {
	const roomsArray = Object.values(rooms);

	return roomsArray.map((room, i) => {
		if (!room) {
			return;
		}

		const roomLink = roomCoordinator.getRouteLink(room.t, room);
		const roomName = roomCoordinator.getRoomName(room.t, room);

		return (
			<Fragment key={i}>
				<a href={roomLink}>#{roomName}</a>
				{i === roomsArray.length - 1 ? '.' : ', '}
			</Fragment>
		);
	});
};

export default RoomLinkList;
