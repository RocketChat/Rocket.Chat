import { isDirectMessageRoom, isInviteSubscription } from '@rocket.chat/core-typings';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { HeaderToolbar, SidebarToggler } from '@rocket.chat/ui-client';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, memo, useMemo } from 'react';

const RoomInviteHeader = lazy(() => import('./RoomInviteHeader'));
const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const RoomHeaderE2EESetup = lazy(() => import('./RoomHeaderE2EESetup'));
const DirectRoomHeader = lazy(() => import('./DirectRoomHeader'));
const RoomHeader = lazy(() => import('./RoomHeader'));

type HeaderProps<T> = {
	room: T;
	subscription?: ISubscription;
};

const Header = ({ room, subscription }: HeaderProps<IRoom>): ReactElement | null => {
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

	if (subscription && isInviteSubscription(subscription)) {
		return <RoomInviteHeader room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader slots={slots} />;
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
