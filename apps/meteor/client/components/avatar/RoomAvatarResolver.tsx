import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import React, { memo, ReactElement, ComponentProps } from 'react';

import DirectRoomAvatar from './DirectRoomAvatar';
import RoomAvatar from './RoomAvatar';

const RoomAvatarResolver = (props: ComponentProps<typeof RoomAvatar>): ReactElement => {
	if (isDirectMessageRoom(props.room) && props.room.uids?.length < 2) {
		return <DirectRoomAvatar {...props} />;
	}

	return <RoomAvatar {...props} />;
};

export default memo(RoomAvatarResolver);
