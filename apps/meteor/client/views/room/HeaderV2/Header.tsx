import type { IRoom } from '@rocket.chat/core-typings';
import { isVoipRoom } from '@rocket.chat/core-typings';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { lazy, memo, useMemo } from 'react';

import { HeaderToolbar } from '../../../components/Header';
import SidebarToggler from '../../../components/SidebarToggler';

const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const VoipRoomHeader = lazy(() => import('./Omnichannel/VoipRoomHeader'));
const RoomHeaderE2EESetup = lazy(() => import('./RoomHeaderE2EESetup'));
const RoomHeader = lazy(() => import('./RoomHeader'));

type HeaderProps = {
	room: IRoom;
};

const Header = ({ room }: HeaderProps): ReactElement | null => {
	const { isMobile, isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	const encrypted = Boolean(room.encrypted);
	const unencryptedMessagesAllowed = useSetting<boolean>('E2E_Allow_Unencrypted_Messages');
	const shouldDisplayE2EESetup = encrypted && !unencryptedMessagesAllowed;

	const slots = useMemo(
		() => ({
			start: isMobile && (
				<HeaderToolbar>
					<SidebarToggler />
				</HeaderToolbar>
			),
		}),
		[isMobile],
	);

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
	}

	if (isVoipRoom(room)) {
		return <VoipRoomHeader slots={slots} room={room} />;
	}

	if (shouldDisplayE2EESetup) {
		return <RoomHeaderE2EESetup room={room} slots={slots} />;
	}

	return <RoomHeader slots={slots} room={room} />;
};

export default memo(Header);
