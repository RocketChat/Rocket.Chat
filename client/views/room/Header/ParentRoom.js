import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Header from '../../../components/Header';
import HeaderIcon from './HeaderIconWithRoom';

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);

	return (
		<Header.Tag>
			<HeaderIcon room={room} />
			<Header.Link href={href}>{roomTypes.getRoomName(room.t, room)}</Header.Link>
		</Header.Tag>
	);
};

export default ParentRoom;
