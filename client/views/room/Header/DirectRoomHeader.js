import React from 'react';

import { useUserId } from '../../../contexts/UserContext';
import { useUserData } from '../../../hooks/useUserData';
import RoomHeader from './RoomHeader';

const DirectRoomHeader = ({ room }) => {
	const userId = useUserId();
	const directUserId = room.uids.filter((uid) => uid !== userId).shift();
	const directUserData = useUserData(directUserId);

	return <RoomHeader room={room} topic={directUserData?.statusText} />;
};

export default DirectRoomHeader;
