import type { IRoom } from '@rocket.chat/core-typings';
import { Header } from '@rocket.chat/ui-client';
import React, { ReactElement } from 'react';

import { useRoomIcon } from '../../../../hooks/useRoomIcon';

type RoomTitleProps = {
	room: IRoom;
};

const RoomTitle = ({ room }: RoomTitleProps): ReactElement => {
	const icon = useRoomIcon(room);
	return (
		<>
			<Header.Icon icon={icon} />
			<Header.Title is='h1'>{room.name}</Header.Title>
		</>
	);
};

export default RoomTitle;
