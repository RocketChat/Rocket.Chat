import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { HeaderToolbar } from '../../../../components/Header';
import SidebarToggler from '../../../../components/SidebarToggler';
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

const OmnichannelRoomHeader = ({ slots: parentSlot }: OmnichannelRoomHeaderProps) => {
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
					{isMobile && <SidebarToggler />}
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
