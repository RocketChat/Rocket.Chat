import { IUser } from '@rocket.chat/core-typings';
import { useRoomAvatarPath } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { usePresence } from '../../hooks/usePresence';
import BaseAvatar from './BaseAvatar';

// TODO: frontend chapter day - Remove inline Styling

type RoomAvatarProps = {
	/* @deprecated */
	size?: 'x16' | 'x20' | 'x28' | 'x36' | 'x40' | 'x124' | 'x332';
	/* @deprecated */
	url?: string;

	room: {
		_id: string;
		u: Pick<IUser, '_id' | 'username' | 'name'>;
		type?: string;
		t?: string;
		uids?: string[];
		avatarETag?: string;
	};
};

const RoomAvatar = function RoomAvatar({ room, ...rest }: RoomAvatarProps): ReactElement {
	const getRoomPathAvatar = useRoomAvatarPath();
	const { avatarETag } = usePresence(room.uids?.filter((uid) => uid !== room.u?._id)[0]) || room;
	const { url = getRoomPathAvatar({ ...room, avatarETag }), ...props } = rest;

	return <BaseAvatar url={url} {...props} />;
};

export default memo(RoomAvatar);
