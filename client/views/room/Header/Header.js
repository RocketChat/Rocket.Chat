import React, { memo } from 'react';

import { useLayout } from '../../../contexts/LayoutContext';
import DirectRoomHeader from './DirectRoomHeader';
import RoomHeader from './RoomHeader';

const Header = ({ room }) => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'd' && room.uids.length < 3) {
		return <DirectRoomHeader room={room} />;
	}

	return <RoomHeader room={room} topic={room.topic} />;
};

export default memo(Header);
