import React, { memo, ReactElement } from 'react';

import { useRoomAvatarPath } from '../../contexts/AvatarUrlContext';
import BaseAvatar from './BaseAvatar';

// TODO: frontend chapter day - Remove inline Styling

type RoomAvatarProps = {
	/* @deprecated */
	size?: 'x16' | 'x20' | 'x28' | 'x36' | 'x40' | 'x124';
	/* @deprecated */
	url?: string;

	room: {
		_id: string;
		type?: string;
		t: string;
		avatarETag?: string;
	};
};

const RoomAvatar = function RoomAvatar({ room, ...rest }: RoomAvatarProps): ReactElement {
	const getRoomPathAvatar = useRoomAvatarPath();
	const { url = getRoomPathAvatar(room), ...props } = rest;
	return <BaseAvatar url={url} {...props} />;
};

export default memo(RoomAvatar);
