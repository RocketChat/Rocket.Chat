import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItemWithData from './NavBarSearchItemWithData';
import NavBarSearchUserRow from './NavBarSearchUserRow';

type NavBarSearchRowProps = {
	room: SubscriptionWithRoom;
	onClick: () => void;
};

const NavBarSearchRow = ({ room, onClick }: NavBarSearchRowProps): ReactElement => {
	const Avatar = <RoomAvatar size='x20' room={{ ...room, _id: room.rid || room._id, type: room.t }} />;

	if (room.t === 'd' && !room.u) {
		return <NavBarSearchUserRow id={`search-${room._id}`} room={room} AvatarTemplate={Avatar} onClick={onClick} />;
	}

	return <NavBarSearchItemWithData id={`search-${room._id}`} room={room} AvatarTemplate={Avatar} onClick={onClick} />;
};

export default memo(NavBarSearchRow);
