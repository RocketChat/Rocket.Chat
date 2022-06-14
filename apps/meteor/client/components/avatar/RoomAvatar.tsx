import { useRoomAvatarPath } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, useState, useEffect } from 'react';

import BaseAvatar from './BaseAvatar';

// TODO: frontend chapter day - Remove inline Styling

type RoomAvatarProps = {
	/* @deprecated */
	size?: 'x16' | 'x20' | 'x28' | 'x36' | 'x40' | 'x124' | 'x332';
	/* @deprecated */
	url?: string;

	room: {
		_id: string;
		type?: string;
		t?: string;
		avatarETag?: string;
	};
};

const RoomAvatar = function RoomAvatar({ room, ...rest }: RoomAvatarProps): ReactElement {
	const getRoomPathAvatar = useRoomAvatarPath();
	const [url, setUrl] = useState('');

	useEffect(() => {
		async function fetchAvatarUrl(): Promise<void> {
			setUrl(await getRoomPathAvatar(room));
		}
		fetchAvatarUrl();
	}, [room, getRoomPathAvatar]);

	return <BaseAvatar url={url} size={rest.size} />;
};

export default memo(RoomAvatar);
