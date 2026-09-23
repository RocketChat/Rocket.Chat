import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import { useShortTimeAgo } from '../../hooks/useTimeAgo';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useOmnichannelPriorities } from '../../views/omnichannel/hooks/useOmnichannelPriorities';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import type { RoomListSettings } from '../contexts/RoomListContext';
import { RoomListContextProvider } from '../contexts/RoomListContext';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { useRoomList } from '../hooks/useRoomList';
import { useSidebarPresentation } from '../hooks/useSidebarPresentation';

/** Gathers what a room list is made of, so whoever draws one only has to read it. */
const RoomListProvider = ({ children }: { children: ReactNode }) => {
	const userId = useUserId();
	const openedRoom = useOpenedRoom() ?? '';
	const formatTime = useShortTimeAgo();
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const { data: canCustomiseGroups = false } = useHasLicenseModule('experimental-enterprise-features');
	const presentation = useSidebarPresentation();
	const moveCategory = useMoveCategoryPosition();

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups } = useRoomList({ collapsedGroups });

	// Memoised apart from the groups, which change as messages arrive; settling them together would
	// redraw everyone reading any part of this for something only the list cares about.
	const settings = useMemo<RoomListSettings>(
		() => ({
			presentation,
			collapse: { keys: collapsedGroups, toggle: handleClick, onKeyDown: handleKeyDown },
			viewer: { userId, isAnonymous: !userId, openedRoom, isPriorityEnabled, canCustomiseGroups, formatTime },
			actions: { moveCategory },
		}),
		[
			presentation,
			collapsedGroups,
			handleClick,
			handleKeyDown,
			userId,
			openedRoom,
			isPriorityEnabled,
			canCustomiseGroups,
			formatTime,
			moveCategory,
		],
	);

	return (
		<RoomListContextProvider settings={settings} groups={groups}>
			{children}
		</RoomListContextProvider>
	);
};

export default RoomListProvider;
