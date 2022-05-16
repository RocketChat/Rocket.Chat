import { IRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import Header from '../../../components/Header';
import { OmnichannelRoomIcon } from '../../../components/RoomIcon/OmnichannelRoomIcon';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

type HeaderIconWithRoomProps = {
	room: IRoom;
};

const HeaderIconWithRoom = ({ room }: HeaderIconWithRoomProps): ReactElement => {
	const icon = useRoomIcon(room);
	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon room={room} size='x20' placement='default' />;
	}

	return <Header.Icon icon={icon} />;
};
export default HeaderIconWithRoom;
