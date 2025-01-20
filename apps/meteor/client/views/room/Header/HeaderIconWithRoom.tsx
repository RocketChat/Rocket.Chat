import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import { HeaderIcon } from '../../../components/Header';
import { OmnichannelRoomIcon } from '../../../components/RoomIcon/OmnichannelRoomIcon';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

type HeaderIconWithRoomProps = {
	room: IRoom;
};

const HeaderIconWithRoom = ({ room }: HeaderIconWithRoomProps): ReactElement => {
	const icon = useRoomIcon(room);
	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon source={room.source} status={room.v?.status} size='x20' />;
	}

	return <HeaderIcon icon={icon} />;
};
export default HeaderIconWithRoom;
