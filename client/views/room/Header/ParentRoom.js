import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Breadcrumbs from '../../../components/Breadcrumbs';
import HeaderIcon from './HeaderIcon';

const ParentRoom = ({ room }) => {
	const href = roomTypes.getRouteLink(room.t, room);

	return (
		<Breadcrumbs.Tag>
			<HeaderIcon room={room} />
			<Breadcrumbs.Link href={href}>{roomTypes.getRoomName(room.t, room)}</Breadcrumbs.Link>
		</Breadcrumbs.Tag>
	);
};

export default ParentRoom;
