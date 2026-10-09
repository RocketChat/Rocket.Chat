import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import NavBarSearchItemWithData from './NavBarSearchItemWithData';
import NavBarSearchUserRow from './NavBarSearchUserRow';

export type NavBarSearchRowProps = {
	room: SubscriptionWithRoom;
	onClick?: () => void;
	avatarSize?: 'x20' | 'x28';
};

const NavBarSearchRow = ({ room, onClick, avatarSize = 'x20' }: NavBarSearchRowProps) => {
	const Avatar = <RoomAvatar size={avatarSize} room={{ ...room, _id: room.rid || room._id, type: room.t }} />;

	if (room.t === 'd' && !room.u) {
		return <NavBarSearchUserRow id={`search-${room._id}`} room={room} AvatarTemplate={Avatar} onClick={onClick} />;
	}

	return <NavBarSearchItemWithData id={`search-${room._id}`} room={room} AvatarTemplate={Avatar} onClick={onClick} />;
};

export default memo(NavBarSearchRow);
