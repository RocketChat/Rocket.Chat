import { HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import BurgerMenu from '../../../../components/BurgerMenu';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';
import QuickActions from './QuickActions';

type OmnichannelRoomHeaderProps = {
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const OmnichannelRoomHeader: FC<OmnichannelRoomHeaderProps> = ({ slots: parentSlot }) => {
	const router = useRouter();

	const currentRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getRouteName(), [router]),
	);

	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || currentRouteName === 'omnichannel-directory' || currentRouteName === 'omnichannel-current-chats') && (
				<HeaderToolbar>
					{isMobile && <BurgerMenu />}
					<BackButton routeName={currentRouteName} />
				</HeaderToolbar>
			),
			posContent: <QuickActions />,
		}),
		[isMobile, currentRouteName, parentSlot],
	);

	return <RoomHeader slots={slots} room={room} />;
};

export default OmnichannelRoomHeader;
