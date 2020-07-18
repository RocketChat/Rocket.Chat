import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import BaseAvatar from './BaseAvatar';

function RoomAvatar({ room: { type, ...room }, ...props }) {
	const avatarUrl = roomTypes.getConfig(type).getAvatarPath({ type, ...room });

	return <BaseAvatar url={avatarUrl} title={avatarUrl} {...props}/>;
}

export default RoomAvatar;
