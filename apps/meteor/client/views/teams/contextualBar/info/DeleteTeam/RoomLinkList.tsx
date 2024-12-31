import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import { Fragment } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

const RoomLinkList = ({ rooms }: { rooms: { [key: string]: Serialized<IRoom> } }) => {
	const roomsArray = Object.values(rooms);

	return (
		<>
			{roomsArray.map((room, i) => {
				const roomLink = roomCoordinator.getRouteLink(room.t, room);

				return (
					<Fragment key={i}>
						<a href={roomLink || undefined}>#{room.fname ?? room.name}</a>
						{i === roomsArray.length - 1 ? '.' : ', '}
					</Fragment>
				);
			})}
		</>
	);
};

export default RoomLinkList;
