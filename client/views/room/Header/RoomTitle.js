import React from 'react';

import Header from '../../../components/Header';
import HeaderIcon from './HeaderIcon';

const RoomTitle = ({ room }) => (
	<>
		<HeaderIcon room={room} />
		<Header.Title>{room.name}</Header.Title>
	</>
);

export default RoomTitle;
