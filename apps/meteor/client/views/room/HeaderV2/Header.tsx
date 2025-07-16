import type { IRoom } from '@rocket.chat/core-typings';
import { isVoipRoom } from '@rocket.chat/core-typings';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, memo } from 'react';

const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const VoipRoomHeader = lazy(() => import('./Omnichannel/VoipRoomHeader'));
const RoomHeaderE2EESetup = lazy(() => import('./RoomHeaderE2EESetup'));
const RoomHeader = lazy(() => import('./RoomHeader'));

type HeaderProps = {
	room: IRoom;
};

const Header = ({ room }: HeaderProps): ReactElement | null => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	const encrypted = Boolean(room.encrypted);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
	const shouldDisplayE2EESetup = encrypted && !unencryptedMessagesAllowed;

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader />;
	}

	if (isVoipRoom(room)) {
		return <VoipRoomHeader room={room} />;
	}

	if (shouldDisplayE2EESetup) {
		return <RoomHeaderE2EESetup room={room} />;
	}

	return <RoomHeader room={room} />;
};

export default memo(Header);
