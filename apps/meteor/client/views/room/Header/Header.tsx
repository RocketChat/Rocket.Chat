import type { IRoom } from '@rocket.chat/core-typings';
import { isVoipRoom } from '@rocket.chat/core-typings';
import { Header as TemplateHeader } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import BurgerMenu from '../../../components/BurgerMenu';
import DirectRoomHeader from './DirectRoomHeader';
import OmnichannelRoomHeader from './Omnichannel/OmnichannelRoomHeader';
import VoipRoomHeader from './Omnichannel/VoipRoomHeader';
import RoomHeader from './RoomHeader';

type HeaderProps<T> = {
	room: T;
};

const Header = ({ room }: HeaderProps<IRoom>): ReactElement | null => {
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

	if (room.t === 'd' && (room.uids?.length ?? 0) < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
	}

	if (isVoipRoom(room)) {
		return <VoipRoomHeader slots={slots} room={room} />;
	}

	return <RoomHeader slots={slots} room={room} topic={room.topic} />;
};

export default memo(Header);
