import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { useRoomListReturnType } from '../../../sidebarv2/hooks/useRoomList';
import { useRoomList } from '../../../sidebarv2/hooks/useRoomList';

export enum SidePanelFilters {
	ALL = 'all',
	MENTIONS = 'mentions',
	STARRED = 'starred',
	DISCUSSIONS = 'discussions',
	IN_PROGRESS = 'inProgress',
	QUEUE = 'queue',
	ON_HOLD = 'onHold',
}

export type RoomsListContextValue = {
	currentFilter: { filter: SidePanelFilters; onlyUnReads: boolean };
	setCurrentFilter: (prevFilter: { filter: SidePanelFilters; onlyUnReads: boolean }) => void;
} & useRoomListReturnType;

export const RoomsListContext = createContext<RoomsListContextValue | undefined>(undefined);

export const RoomsListContextProvider = ({ children }: { children: ReactNode }) => {
	const [currentFilter, setCurrentFilter] = useLocalStorage<{ filter: SidePanelFilters; onlyUnReads: boolean }>('sidePanelExperimental', {
		filter: SidePanelFilters.ALL,
		onlyUnReads: false,
	});

	const { sideBar, sidePanel } = useRoomList({ onlyUnReads: currentFilter.onlyUnReads });

	const contextValue = useMemo(() => {
		return { currentFilter, setCurrentFilter, sideBar, sidePanel };
	}, [currentFilter, sideBar, sidePanel, setCurrentFilter]);

	return <RoomsListContext.Provider value={contextValue}>{children}</RoomsListContext.Provider>;
};

export const useRoomsListContext = () => {
	const contextValue = useContext(RoomsListContext);

	if (!contextValue) {
		throw new Error('useRoomsListValue must be used within a RoomsListContextProvider');
	}

	return contextValue;
};
