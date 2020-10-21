import React from 'react';

import BaseAvatar from './BaseAvatar';
import { useRoomAvatarPath } from '../../../contexts/AvatarContext';

function RoomAvatar({ room, ...rest }) {
	const getRoomPathAvatar = useRoomAvatarPath();
	const { url = getRoomPathAvatar(room), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
}

export default RoomAvatar;
