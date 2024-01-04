import type { IRoom } from '@rocket.chat/core-typings';
import { HeaderTitle, useDocumentTitle } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import HeaderIconWithRoom from './HeaderIconWithRoom';

type RoomTitleProps = {
	room: IRoom;
};

const RoomTitle = ({ room }: RoomTitleProps): ReactElement => {
	useDocumentTitle(room.name, false);

	return (
		<>
			<HeaderIconWithRoom room={room} />
			<HeaderTitle is='h1'>{room.name}</HeaderTitle>
		</>
	);
};

export default RoomTitle;
