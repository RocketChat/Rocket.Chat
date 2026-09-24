import { isInviteSubscription } from '@rocket.chat/core-typings';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useLayout } from '@rocket.chat/ui-contexts';
import { lazy, memo } from 'react';

import RoomHeaderActionsProvider from './RoomHeaderActionsProvider';
import { useRoomFeatures } from '../contexts/RoomFeaturesContext';
import { shouldDisplayE2EESetup } from '../lib/shouldDisplayE2EESetup';

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
	const { e2eEnabled, unencryptedMessagesAllowed } = useRoomFeatures();
	const displayE2EESetup = shouldDisplayE2EESetup(room, { e2eEnabled, unencryptedMessagesAllowed });

	if (isEmbedded && !showTopNavbarEmbeddedLayout) {
		return null;
	}

	return <RoomHeaderActionsProvider>{renderVariant(room, subscription, displayE2EESetup)}</RoomHeaderActionsProvider>;
};

const renderVariant = (room: IRoom, subscription: ISubscription | undefined, displayE2EESetup: boolean) => {
	if (subscription && isInviteSubscription(subscription)) {
		return <RoomInviteHeader room={room} />;
	}

	if (room.t === 'l') {
		return <OmnichannelRoomHeader />;
	}

	if (displayE2EESetup) {
		return <RoomHeaderE2EESetup room={room} />;
	}

	return <RoomHeader room={room} />;
};

export default memo(Header);
