import type { IRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import { HeaderTag, HeaderTagIcon } from '../../../components/Header';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

type ParentRoomProps = {
	room: Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'prid' | 'u'>;
};

const ParentRoom = ({ room }: ParentRoomProps): ReactElement => {
	const icon = useRoomIcon(room);

	const handleRedirect = (): void => roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room });

	return (
		<HeaderTag
			role='button'
			tabIndex={0}
			onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter') && handleRedirect()}
			onClick={handleRedirect}
		>
			<HeaderTagIcon icon={icon} />
			{roomCoordinator.getRoomName(room.t, room)}
		</HeaderTag>
	);
};

export default ParentRoom;
