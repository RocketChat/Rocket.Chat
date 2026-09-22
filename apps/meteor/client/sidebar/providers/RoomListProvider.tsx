import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useShortTimeAgo } from '../../hooks/useTimeAgo';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useOmnichannelPriorities } from '../../views/omnichannel/hooks/useOmnichannelPriorities';
import { useMoveCategoryPosition } from '../categories/hooks/useMoveCategoryPosition';
import type { RoomListContextValue } from '../contexts/RoomListContext';
import { RoomListContext } from '../contexts/RoomListContext';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { useRoomList } from '../hooks/useRoomList';
import { useSidebarPresentation } from '../hooks/useSidebarPresentation';

/** Gathers what a room list is made of, so whoever draws one only has to read it. */
const RoomListProvider = ({ children }: { children: ReactNode }) => {
	const userId = useUserId();
	const openedRoom = useOpenedRoom() ?? '';
	const formatTime = useShortTimeAgo();
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const presentation = useSidebarPresentation();
	const moveCategory = useMoveCategoryPosition();

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();
	const { groups } = useRoomList({ collapsedGroups });

	const value = useMemo<RoomListContextValue>(
		() => ({
			groups,
			presentation,
			collapse: { keys: collapsedGroups, toggle: handleClick, onKeyDown: handleKeyDown },
			viewer: { userId, isAnonymous: !userId, openedRoom, isPriorityEnabled, formatTime },
			actions: { moveCategory },
		}),
		[groups, presentation, collapsedGroups, handleClick, handleKeyDown, userId, openedRoom, isPriorityEnabled, formatTime, moveCategory],
	);

	return <RoomListContext.Provider value={value}>{children}</RoomListContext.Provider>;
};

export default RoomListProvider;
