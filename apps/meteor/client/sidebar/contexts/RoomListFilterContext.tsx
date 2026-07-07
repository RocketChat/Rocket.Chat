import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import type { SidebarRoomListFilter } from '../hooks/useRoomList';

type RoomListFilterContextValue = {
	filter: SidebarRoomListFilter;
	setFilter: (filter: SidebarRoomListFilter) => void;
};

const RoomListFilterContext = createContext<RoomListFilterContextValue>({
	filter: 'all',
	setFilter: () => undefined,
});

/**
 * Holds the ephemeral top-of-sidebar tag filter ('all' | 'unreads' | 'mentions' | 'drafts'). It is shared
 * between the filter tags and the room list, and intentionally not persisted — it resets to "All" on reload.
 */
export const RoomListFilterProvider = ({ children }: { children: ReactNode }) => {
	const [filter, setFilter] = useState<SidebarRoomListFilter>('all');
	const value = useMemo(() => ({ filter, setFilter }), [filter]);
	return <RoomListFilterContext.Provider value={value}>{children}</RoomListFilterContext.Provider>;
};

export const useRoomListFilter = (): RoomListFilterContextValue => useContext(RoomListFilterContext);
