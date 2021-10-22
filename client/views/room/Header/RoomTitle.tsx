import React, { ReactElement } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import Header from '../../../components/Header';
import HeaderIconWithRoom from './HeaderIconWithRoom';

const RoomTitle = ({ room }: { room: IRoom }): ReactElement => (
	<>
		<HeaderIconWithRoom room={room} />
		<Header.Title>{room.name}</Header.Title>
	</>
);

export default RoomTitle;
