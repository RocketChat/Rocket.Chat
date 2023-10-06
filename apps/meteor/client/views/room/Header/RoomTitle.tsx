import type { IRoom } from '@rocket.chat/core-typings';
import { HeaderTitle } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import HeaderIconWithRoom from './HeaderIconWithRoom';

type RoomTitleProps = {
	room: IRoom;
};

const RoomTitle = ({ room }: RoomTitleProps): ReactElement => (
	<>
		<HeaderIconWithRoom room={room} />
		<HeaderTitle is='h1'>{room.name}</HeaderTitle>
	</>
);

export default RoomTitle;
