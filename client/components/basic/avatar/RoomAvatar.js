import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

import { roomTypes } from '../../../../app/utils/client';

function RoomAvatar({ room: { type, ...room }, ...props }) {
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath({ type, ...room });

	return <Avatar url={avatarUrl} title={avatarUrl} {...props}/>;
}

export default RoomAvatar;
