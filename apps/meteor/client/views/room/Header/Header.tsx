import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isVoipRoom } from '@rocket.chat/core-typings';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, memo, useMemo } from 'react';

import { HeaderToolbar } from '../../../components/Header';
import SidebarToggler from '../../../components/SidebarToggler';

const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const VoipRoomHeader = lazy(() => import('./Omnichannel/VoipRoomHeader'));
const RoomHeaderE2EESetup = lazy(() => import('./RoomHeaderE2EESetup'));
const DirectRoomHeader = lazy(() => import('./DirectRoomHeader'));
const RoomHeader = lazy(() => import('./RoomHeader'));

type HeaderProps<T> = {
	room: T;
};

const Header = ({ room }: HeaderProps<IRoom>): ReactElement | null => {
	const { isMobile, isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	const encrypted = Boolean(room.encrypted);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
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
		return <RoomHeaderE2EESetup room={room} topic={room.topic} slots={slots} />;
	}

	if (isDirectMessageRoom(room) && (room.uids?.length ?? 0) < 3) {
		return <DirectRoomHeader slots={slots} room={room} />;
	}

	return <RoomHeader room={room} topic={room.topic} slots={slots} />;
};

export default memo(Header);
