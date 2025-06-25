import type { IRoom } from '@rocket.chat/core-typings';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';

import { HeaderTag, HeaderTagIcon } from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type ParentRoomProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentRoom = ({ room }: ParentRoomProps): ReactElement => {
	const icon = useRoomIcon(room);

	const handleRedirect = () => roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room });
	const buttonProps = useButtonPattern(handleRedirect);

	return (
		<HeaderTag {...buttonProps}>
			<HeaderTagIcon icon={icon} />
			{roomCoordinator.getRoomName(room.t, room)}
		</HeaderTag>
	);
};

export default ParentRoom;
