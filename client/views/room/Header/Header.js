import React, { memo, useMemo } from 'react';

import BurgerMenu from '../../../components/BurgerMenu';
import TemplateHeader from '../../../components/Header';
import { useLayout } from '../../../contexts/LayoutContext';
import DirectRoomHeader from './DirectRoomHeader';
import OmnichannelRoomHeader from './Omnichannel/OmnichannelRoomHeader';
import VoipRoomHeader from './Omnichannel/VoipRoomHeader';
import RoomHeader from './RoomHeader';

const Header = ({ room }) => {
	const { isMobile, isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();

	const slots = useMemo(
		() => ({
			start: isMobile && (
				<TemplateHeader.ToolBox>
					<BurgerMenu />
				</TemplateHeader.ToolBox>
			),
		}),
		[isMobile],
	);

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'd' && room.uids?.length < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
	}

	if (room.t === 'v') {
		return <VoipRoomHeader slots={slots} room={room} />;
	}

	return <RoomHeader slots={slots} room={room} topic={room.topic} />;
};

export default memo(Header);
