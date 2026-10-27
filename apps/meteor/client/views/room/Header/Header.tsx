import { isInviteSubscription } from '@rocket.chat/core-typings';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useLayout } from '@rocket.chat/ui-contexts';
import { lazy, memo } from 'react';

import { useShouldDisplayE2EESetup } from '../hooks/useShouldDisplayE2EESetup';

const RoomInviteHeader = lazy(() => import('./RoomInviteHeader'));
const OmnichannelRoomHeader = lazy(() => import('./Omnichannel/OmnichannelRoomHeader'));
const RoomHeaderE2EESetup = lazy(() => import('./RoomHeaderE2EESetup'));
const RoomHeader = lazy(() => import('./RoomHeader'));

export type HeaderProps = {
	room: IRoom;
	subscription?: ISubscription;
};

const Header = ({ room, subscription }: HeaderProps) => {
	const { isEmbedded, showTopNavbarEmbeddedLayout } = useLayout();
	const shouldDisplayE2EESetup = useShouldDisplayE2EESetup(room);

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	if (subscription && isInviteSubscription(subscription)) {
		return <RoomInviteHeader room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader />;
	}

	if (shouldDisplayE2EESetup) {
		return <RoomHeaderE2EESetup room={room} />;
	}

	return <RoomHeader room={room} />;
};

export default memo(Header);
