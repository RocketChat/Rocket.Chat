import React, { memo } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import BaseAvatar from './BaseAvatar';

const RoomAvatar = function RoomAvatar({ room: { type, ...room }, ...rest }) {
	const { url = roomTypes.getConfig(type).getAvatarPath({ username: room._id, ...room }), ...props } = rest;
	return <BaseAvatar url={url} {...props}/>;
};

export default memo(RoomAvatar);
