import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';

import type { SidePanelFiltersKeys, AllGroupsKeysWithUnread } from '../contexts/RoomsNavigationContext';
import { SIDE_PANEL_GROUPS, getFilterKey } from '../contexts/RoomsNavigationContext';

export const useSidePanelFilters = () => {
	const {
		sidePanel: { openSidePanel },
	} = useLayout();
	const [currentFilter, setCurrentFilter] = useLocalStorage<AllGroupsKeysWithUnread>(
		'sidePanelFilters',
		getFilterKey(SIDE_PANEL_GROUPS.ALL, false),
	);

	const setFilter = useEffectEvent((filter: SidePanelFiltersKeys, unread: boolean) => {
		openSidePanel();
		setCurrentFilter(getFilterKey(filter, unread));
	});

	return { currentFilter, setFilter };
};
