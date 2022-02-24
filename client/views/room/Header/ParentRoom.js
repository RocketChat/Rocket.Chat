import React from 'react';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

const ParentRoom = ({ room }) => {
	const href = roomCoordinator.getRouteLink(room.t, room);
	const icon = useRoomIcon(room);

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={icon} />
			<Header.Link href={href}>{roomCoordinator.getRoomName(room.t, room)}</Header.Link>
		</Header.Tag>
	);
};

export default ParentRoom;
