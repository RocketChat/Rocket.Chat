import type { IRoom } from '@rocket.chat/core-typings';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

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
			<Header.Link href={href}>
				<Header.Tag.Icon icon={icon} />
				{roomCoordinator.getRoomName(room.t, room)}
			</Header.Link>
		</Header.Tag>
	);
};

export default ParentRoom;
