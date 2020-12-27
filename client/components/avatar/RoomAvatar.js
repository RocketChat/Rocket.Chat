import React, { memo } from 'react';

import { useRoomAvatarPath } from '../../contexts/AvatarUrlContext';
import BaseAvatar from './BaseAvatar';

const RoomAvatar = ({ room, url, ...props }) => {
	const getRoomPathAvatar = useRoomAvatarPath();
	url = url ?? getRoomPathAvatar(room);
	return <BaseAvatar url={url} {...props}/>;
};

export default memo(RoomAvatar);
