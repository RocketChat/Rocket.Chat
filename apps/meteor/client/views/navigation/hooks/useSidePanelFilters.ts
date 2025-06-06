import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';

import type { SidePanelFiltersKeys, AllGroupsKeysWithUnread } from '../contexts/RoomsNavigationContext';
import { SIDE_PANEL_GROUPS, getFilterKey } from '../contexts/RoomsNavigationContext';

export const useSidePanelFilters = () => {
	const [currentFilter, setCurrentFilter] = useLocalStorage<AllGroupsKeysWithUnread>(
		'sidePanelFilters',
		getFilterKey(SIDE_PANEL_GROUPS.ALL, false),
	);

	const setFilter = useEffectEvent((filter: SidePanelFiltersKeys, unread: boolean) => {
		setCurrentFilter(getFilterKey(filter, unread));
	});

	return { currentFilter, setFilter };
};
