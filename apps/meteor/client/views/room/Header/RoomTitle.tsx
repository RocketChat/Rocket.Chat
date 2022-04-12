import React, { ReactElement } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import Header from '../../../components/Header';
import HeaderIconWithRoom from './HeaderIconWithRoom';

type RoomTitleProps = {
	room: IRoom;
};

const RoomTitle = ({ room }: RoomTitleProps): ReactElement => (
	<>
		<HeaderIconWithRoom room={room} />
		<Header.Title>{room.name}</Header.Title>
	</>
);

export default RoomTitle;
