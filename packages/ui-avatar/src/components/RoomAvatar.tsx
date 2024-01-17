import { useRoomAvatarPath } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import Avatar, { UiAvatarProps } from './Avatar';

type RoomAvatarProps = Pick<UiAvatarProps, 'size'> & {
	url?: string;
	room: {
		_id: string;
		type?: string;
		t?: string;
		avatarETag?: string;
	};
};

const RoomAvatar = function RoomAvatar({ room, url, size }: RoomAvatarProps): ReactElement {
	const getRoomPathAvatar = useRoomAvatarPath();
	const urlFromContext = getRoomPathAvatar(room);

	return <Avatar url={url || urlFromContext} size={size} />;
};

export default memo(RoomAvatar);
