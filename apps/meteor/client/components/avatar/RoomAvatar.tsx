import { IRoom } from '@rocket.chat/core-typings';
import { useRoomAvatarPath } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import BaseAvatar from './BaseAvatar';

// TODO: frontend chapter day - Remove inline Styling

type RoomAvatarProps = {
	/* @deprecated */
	size?: 'x16' | 'x20' | 'x28' | 'x36' | 'x40' | 'x124' | 'x332';
	/* @deprecated */
	url?: string;
	room: IRoom;
};

const RoomAvatar = function RoomAvatar({ room, ...rest }: RoomAvatarProps): ReactElement {
	const getRoomPathAvatar = useRoomAvatarPath();
	const { url = getRoomPathAvatar(room), ...props } = rest;
	return <BaseAvatar url={url} {...props} />;
};

export default memo(RoomAvatar);
