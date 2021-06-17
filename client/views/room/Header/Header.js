import React, { memo, useMemo } from 'react';

import TemplateHeader from '../../../components/Header';
import { useLayout } from '../../../contexts/LayoutContext';
import Burger from './Burger';
import DirectRoomHeader from './DirectRoomHeader';
import OmnichannelRoomHeader from './Omnichannel/OmnichannelRoomHeader';
import RoomHeader from './RoomHeader';

const Header = ({ room }) => {
	const { isMobile, isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();

	const slots = useMemo(
		() => ({
			start: isMobile && (
				<TemplateHeader.ToolBox>
					<Burger />
				</TemplateHeader.ToolBox>
			),
		}),
		[isMobile],
	);

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'd' && room.uids.length < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
	}

	return <RoomHeader slots={slots} room={room} topic={room.topic} />;
};

export default memo(Header);
