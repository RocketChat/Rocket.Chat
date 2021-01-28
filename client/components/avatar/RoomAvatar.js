import React, { memo } from 'react';

import BaseAvatar from './BaseAvatar';
import { useRoomAvatarPath } from '../../contexts/AvatarUrlContext';
import { useUserRoom } from '../../../client/views/room/hooks/useUserRoom';

function RoomAvatar({ room, ...rest }) {
	const getRoomPathAvatar = useRoomAvatarPath();
	const roomWithAvatarTag = useUserRoom(room._id)
	const { url = getRoomPathAvatar(roomWithAvatarTag), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
}

export default memo(RoomAvatar);
