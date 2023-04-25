import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

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
