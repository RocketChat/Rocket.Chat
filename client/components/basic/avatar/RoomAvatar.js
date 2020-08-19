import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import BaseAvatar from './BaseAvatar';

function RoomAvatar({ room: { type, ...room }, ...rest }) {
	const { url = roomTypes.getConfig(type).getAvatarPath({ username: room._id, ...room }), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
}

export default RoomAvatar;
