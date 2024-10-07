import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React from 'react';

import { HeaderTag, HeaderTagIcon } from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type ParentRoomProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const hasSubscription = (room: ParentRoomProps['room']): boolean => roomCoordinator.getRoomDirectives(room.t).hasSubscription(room._id);
const ParentRoom = ({ room }: ParentRoomProps): ReactElement => {
	const icon = useRoomIcon(room);

	const handleRedirect = hasSubscription(room)
		? (): void => {
				roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room });
		  }
		: undefined;

	return (
		<HeaderTag
			role='button'
			tabIndex={0}
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && handleRedirect?.()}
			onClick={handleRedirect}
		>
			<HeaderTagIcon icon={icon} />
			{roomCoordinator.getRoomName(room.t, room)}
		</HeaderTag>
	);
};

export default ParentRoom;
