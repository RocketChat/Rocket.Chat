import type { IRoom } from '@rocket.chat/core-typings';
import { Header } from '@rocket.chat/ui-client';
import React, { FC } from 'react';

import RoomAvatar from '../../../components/avatar/RoomAvatar';
import RoomTitle from '../../room/Header/RoomTitle';

export type UnreadsHeaderProps = {
	room: IRoom;
};

const UnreadsHeader: FC<UnreadsHeaderProps> = ({ room }) => (
	<Header>
		{room.t !== 'l' && (
			<Header.Avatar>
				<RoomAvatar room={room} />
			</Header.Avatar>
		)}
		<Header.Content>
			<Header.Content.Row>
				<RoomTitle room={room} />
			</Header.Content.Row>
		</Header.Content>
	</Header>
);

export default UnreadsHeader;
