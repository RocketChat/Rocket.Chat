import React from 'react';

import { isOmnichannelRoom } from '../../../../definition/IRoom';
import Header from '../../../components/Header';
import { OmnichannelRoomIcon } from '../../../components/RoomIcon/OmnichannelRoomIcon';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

const HeaderIconWithRoom = ({ room }) => {
	const icon = useRoomIcon(room);
	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon room={room} size='x16' placement='default' />;
	}
	return <Header.Icon icon={icon} />;
};
export default HeaderIconWithRoom;
