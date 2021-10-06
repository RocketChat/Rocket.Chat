import React from 'react';

import Header from '../../../components/Header';
import HeaderIconWithRoom from './HeaderIconWithRoom';

const RoomTitle = ({ room }) => (
	<>
		<HeaderIconWithRoom room={room} />
		<Header.Title>{room.name}</Header.Title>
	</>
);

export default RoomTitle;
