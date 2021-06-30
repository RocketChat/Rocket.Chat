import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);
	const icon = useRoomIcon(room);

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={icon} />
			<Header.Link href={href}>{roomTypes.getRoomName(room.t, room)}</Header.Link>
		</Header.Tag>
	);
};

export default ParentRoom;
