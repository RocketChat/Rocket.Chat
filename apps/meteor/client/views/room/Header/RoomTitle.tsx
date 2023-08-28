import type { IRoom, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
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
		{(room as IOmnichannelRoom)?.verificationStatus === 'verified' && (
			<Icon name='success-circle' color='status-font-on-success' size='x16' m='0.10rem 0 0 0.125rem' />
		)}
	</>
);

export default RoomTitle;
