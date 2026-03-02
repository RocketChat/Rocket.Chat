import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItemWithData from './NavBarSearchItemWithData';
import NavBarSearchUserRow from './NavBarSearchUserRow';
import type { SearchRenderableItem } from './hooks/useSearchItems';

type NavBarSearchRowProps = {
	room: SearchRenderableItem;
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
