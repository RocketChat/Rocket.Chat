import React, { memo } from 'react';

import BaseAvatar from './BaseAvatar';
import { useRoomAvatarPath } from '../../contexts/AvatarUrlContext';

function RoomAvatar({ room, ...rest }) {
	const getRoomPathAvatar = useRoomAvatarPath();
	const { url = getRoomPathAvatar(room), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
}

export default memo(RoomAvatar);
