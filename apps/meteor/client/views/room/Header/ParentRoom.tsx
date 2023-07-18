import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { HeaderTag, HeaderTagIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type ParentRoomProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentRoom = ({ room }: ParentRoomProps): ReactElement => {
	const icon = useRoomIcon(room);

	const handleClick = (): void => roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room });

	return (
		<HeaderTag onClick={handleClick}>
			<HeaderTagIcon icon={icon} />
			<Box display='inline-block' mis='x6'>
				{roomCoordinator.getRoomName(room.t, room)}
			</Box>
		</HeaderTag>
	);
};

export default ParentRoom;
