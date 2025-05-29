import { createContext, useContext } from 'react';

import type { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import type { useSidePanelFilters } from '../hooks/useSidePanelFilters';
import type { useRoomsGroupsReturnType } from '../providers/RoomsNavigationProvider';

export const TEAM_COLLAB_GROUPS = {
	ALL: 'All',
	STARRED: 'Starred',
	MENTIONS: 'Mentions',
	DISCUSSIONS: 'Discussions',
} as const;

export const OMNICHANNEL_GROUPS = {
	IN_PROGRESS: 'In_progress',
	QUEUE: 'Queue',
	ON_HOLD: 'On_Hold',
} as const;

export const SIDE_PANEL_GROUPS = {
	...TEAM_COLLAB_GROUPS,
	...OMNICHANNEL_GROUPS,
} as const;

export const SIDE_BAR_GROUPS = {
	TEAMS: 'Teams',
	CHANNELS: 'Channels',
	DIRECT_MESSAGES: 'Direct_Messages',
} as const;

export type SidePanelFilters = (typeof SIDE_PANEL_GROUPS)[keyof typeof SIDE_PANEL_GROUPS];

export type RoomsNavigationContextValue = {
	sideBar: useRoomsGroupsReturnType['sideBar'] & ReturnType<typeof useCollapsedGroups>;
	sidePanel: useRoomsGroupsReturnType['sidePanel'] & ReturnType<typeof useSidePanelFilters>;
};

export const RoomsNavigationContext = createContext<RoomsNavigationContextValue | undefined>(undefined);

export const useRoomsListContext = () => {
	const contextValue = useContext(RoomsNavigationContext);

	if (!contextValue) {
		throw new Error('useRoomsListValue must be used within a RoomsNavigationContext');
	}

	return contextValue;
};

export const useSideBarRoomsList = () => useRoomsListContext().sideBar;
export const useSidePanelRoomsList = () => useRoomsListContext().sidePanel;
