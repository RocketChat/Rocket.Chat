import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

import { SIDE_PANEL_GROUPS, type SidePanelFilters } from '../contexts/RoomsNavigationContext';

export const useSidePanelFilters = () => {
	const [currentFilter, setCurrentFilter] = useLocalStorage<{ filter: SidePanelFilters; onlyUnReads: boolean }>('sidePanelFilters', {
		filter: SIDE_PANEL_GROUPS.ALL,
		onlyUnReads: false,
	});

	return { currentFilter, setCurrentFilter };
};
