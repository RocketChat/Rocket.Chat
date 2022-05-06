import { IRoom, isDirectMessageRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

import { ReactiveUserStatus } from '../UserStatus';
import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';

export const RoomIcon: FC<{
	room: IRoom;
	size: ComponentProps<typeof Icon>['size'];
	highlighted?: boolean;
	placement: 'sidebar' | 'default';
}> = ({ room, size = 'x16', placement }) => {
	if (room.prid) {
		return <Icon name='baloons' size={size} />;
	}

	if (room.teamMain) {
		return <Icon name={room.t === 'p' ? 'team-lock' : 'team'} size={size} />;
	}

	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon placement={placement} room={room} size={size} />;
	}
	if (isDirectMessageRoom(room)) {
		if (room.uids && room.uids.length > 2) {
			return <Icon name='balloon' size={size} />;
		}
		if (room.uids && room.uids.length > 0) {
			return <ReactiveUserStatus uid={room.uids.filter((uid) => uid !== room.u._id)[0] || room.u._id} />;
		}
		return <Icon name='at' size={size} />;
	}

	switch (room.t) {
		case 'p':
			return <Icon name='hashtag-lock' size={size} />;
		case 'c':
			return <Icon name='hash' size={size} />;
		default:
			return null;
	}
};
