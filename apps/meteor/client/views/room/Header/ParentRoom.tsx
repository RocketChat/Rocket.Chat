import type { IRoom } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import Header from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type ParentRoomProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentRoom = ({ room }: ParentRoomProps): ReactElement => {
	const href = roomCoordinator.getRouteLink(room.t, room) || undefined;
	const icon = useRoomIcon(room);

	return (
		<Header.Tag>
			<Header.Tag.Icon icon={icon} />
			<Header.Link href={href}>{roomCoordinator.getRoomName(room.t, room)}</Header.Link>
		</Header.Tag>
	);
};

export default ParentRoom;
